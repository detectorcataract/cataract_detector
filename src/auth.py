from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
import jwt
from flask import Blueprint, jsonify, request

# ── Blueprint ──────────────────────────────────────────────────────────────────
# Register this in your main app.py with: app.register_blueprint(auth_bp)
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# ── Config ─────────────────────────────────────────────────────────────────────
# Set these in your .env file
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret-in-production")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", 24))

# ── DB ─────────────────────────────────────────────────────────────────────────
# Import your db instance — adjust this import to match your project structure.
# If you're using Flask-SQLAlchemy, this is typically from extensions.py or app.py
from extensions import db # noqa: E402


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, plain_password: str) -> None:
        """Hash and store the password using bcrypt."""
        self.password_hash = bcrypt.hashpw(
            plain_password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, plain_password: str) -> bool:
        """Verify a plain password against the stored hash."""
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            self.password_hash.encode("utf-8"),
        )

    def to_dict(self) -> dict:
        return {"id": self.id, "email": self.email, "created_at": str(self.created_at)}


# ── JWT helpers ────────────────────────────────────────────────────────────────

def generate_token(user_id: int) -> str:
    """Generate a signed JWT that expires after JWT_EXPIRY_HOURS."""
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT. Returns the payload or None if invalid/expired."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """
    Decorator to protect routes that require authentication.

    Usage:
        @app.get("/api/protected")
        @token_required
        def protected_route(current_user):
            return jsonify(current_user.to_dict())
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization header missing or malformed."}), 401

        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        if payload is None:
            return jsonify({"error": "Token is invalid or expired."}), 401

        current_user = db.session.get(User, payload["user_id"])
        if current_user is None:
            return jsonify({"error": "User not found."}), 401

        return f(current_user, *args, **kwargs)
    return decorated


# ── Routes ─────────────────────────────────────────────────────────────────────

@auth_bp.post("/register")
def register():
    """
    POST /api/auth/register
    Body: { "email": "...", "password": "..." }
    """
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", "")).strip()

    # Basic validation
    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    # Create user
    user = User(email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id)

    return jsonify({
        "message": "Account created successfully.",
        "token": token,
        "user": user.to_dict(),
    }), 201


@auth_bp.post("/login")
def login():
    """
    POST /api/auth/login
    Body: { "email": "...", "password": "..." }
    """
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", "")).strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()

    # Intentionally vague message to avoid leaking whether the email exists
    if user is None or not user.check_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = generate_token(user.id)

    return jsonify({
        "message": "Logged in successfully.",
        "token": token,
        "user": user.to_dict(),
    })




@auth_bp.post("/logout")
@token_required
def logout(current_user):
    """
    POST /api/auth/logout
    Header: Authorization: Bearer <token>

    With stateless JWT, logout is handled on the frontend by deleting the token.
    This endpoint exists so your React app has a consistent API to call,
    and is also where you'd add a token blocklist if needed later.
    """
    return jsonify({"message": "Logged out successfully."})


@auth_bp.get("/me")
@token_required
def me(current_user):
    """
    GET /api/auth/me
    Header: Authorization: Bearer <token>
    Returns the currently authenticated user's info.
    """
    return jsonify({"user": current_user.to_dict()})

