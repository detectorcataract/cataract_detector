from __future__ import annotations

import json
import os
import sys
import uuid
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parent
SRC_DIR = PROJECT_ROOT / "src"
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", PROJECT_ROOT / "uploads"))
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_CONTENT_LENGTH = 8 * 1024 * 1024
load_dotenv(PROJECT_ROOT / ".env")

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from gemini_helper import ask_question, generate_report  # noqa: E402
from predict import predict_cataract, PROJECT_ROOT  # noqa: E402

# ── Extensions (db must be imported before auth) ───────────────────────────────
from extensions import db  # noqa: E402
from auth import auth_bp, token_required  # noqa: E402


# ── App factory ────────────────────────────────────────────────────────────────
app = Flask(__name__)

# Database
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Upload size limit
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
app.config["UPLOAD_FOLDER"] = str(UPLOAD_DIR)

# Init extensions
db.init_app(app)

# Register auth blueprint — mounts /api/auth/register, /login, /logout, /me
app.register_blueprint(auth_bp)

# Create all DB tables (users table from auth.py) on first run
with app.app_context():
    db.create_all()

# In-memory cache for follow-up questions during local development
ANALYSES: dict[str, dict[str, Any]] = {}


# ── CORS ───────────────────────────────────────────────────────────────────────
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = os.getenv("CORS_ORIGIN", "*")
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/")
def index():
    return jsonify(
        {
            "message": "Cataract detector API is running.",
            "endpoints": {
                "register": "POST /api/auth/register",
                "login":    "POST /api/auth/login",
                "logout":   "POST /api/auth/logout",
                "me":       "GET  /api/auth/me",
                "analyze":  "POST /api/analyze  [auth required]",
                "chat":     "POST /api/chat     [auth required]",
                "health":   "GET  /api/health",
            },
        }
    )


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/analyze")
@token_required                          # 🔒 login required
def analyze_image(current_user):         # current_user injected by decorator
    if "image" not in request.files:
        return error_response("Please upload an image using the 'image' field.", 400)

    image_file = request.files["image"]
    if not image_file.filename:
        return error_response("Uploaded image is missing a filename.", 400)

    if not is_allowed_file(image_file.filename):
        return error_response("Only jpg, jpeg, png, and webp images are supported.", 400)

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_filename = build_stored_filename(image_file.filename)
    image_path = UPLOAD_DIR / stored_filename
    image_file.save(image_path)

    symptoms = parse_symptoms(request.form.getlist("symptoms"), request.form.get("symptoms"))

    try:
        prediction_result = predict_cataract(image_path)
        prediction = str(prediction_result["label"])
        confidence_percent = round(float(prediction_result["confidence"]) * 100, 2)
        report = generate_report(prediction, confidence_percent, symptoms)
    except Exception as exc:
        return error_response(str(exc), 500)

    analysis_id = uuid.uuid4().hex
    analysis = {
        "analysis_id": analysis_id,
        "user_id": current_user.id,        # tie analysis to logged-in user
        "image": {
            "filename": stored_filename,
            "url": f"/uploads/{stored_filename}",
        },
        "prediction": prediction,
        "confidence": confidence_percent,
        "symptoms": symptoms,
        "report": report,
        "raw_prediction": prediction_result,
    }
    ANALYSES[analysis_id] = analysis

    return jsonify(analysis)


@app.post("/api/chat")
@token_required                          # 🔒 login required
def chat(current_user):
    payload = request.get_json(silent=True) or {}
    question = str(payload.get("question", "")).strip()
    if not question:
        return error_response("Question is required.", 400)

    prediction, confidence = get_chat_context(payload, current_user.id)
    if prediction is None or confidence is None:
        return error_response(
            "Send analysis_id from /api/analyze, or provide prediction and confidence.",
            400,
        )

    try:
        answer = ask_question(question, prediction, confidence)
    except Exception as exc:
        return error_response(str(exc), 500)

    return jsonify(
        {
            "question": question,
            "answer": answer,
            "prediction": prediction,
            "confidence": confidence,
        }
    )


@app.get("/uploads/<path:filename>")
def uploaded_file(filename: str):
    return send_from_directory(UPLOAD_DIR, filename)


# ── Error handlers ─────────────────────────────────────────────────────────────
@app.errorhandler(413)
def file_too_large(_error):
    return error_response("Uploaded image is too large. Maximum size is 8 MB.", 413)


@app.errorhandler(404)
def not_found(_error):
    return error_response("Route not found.", 404)


# ── Helpers ────────────────────────────────────────────────────────────────────
def is_allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def build_stored_filename(filename: str) -> str:
    safe_name = secure_filename(filename)
    suffix = Path(safe_name).suffix.lower()
    return f"{uuid.uuid4().hex}{suffix}"


def parse_symptoms(repeated_values: list[str], raw_value: str | None) -> list[str]:
    values = repeated_values or []

    if raw_value and not values:
        try:
            decoded = json.loads(raw_value)
            if isinstance(decoded, list):
                values = [str(item) for item in decoded]
            else:
                values = [str(decoded)]
        except json.JSONDecodeError:
            values = raw_value.split(",")

    return [value.strip() for value in values if value and value.strip()]


def get_chat_context(payload: dict[str, Any], user_id: int) -> tuple[str | None, float | None]:
    analysis_id = payload.get("analysis_id")
    if analysis_id and analysis_id in ANALYSES:
        analysis = ANALYSES[str(analysis_id)]
        # Make sure the analysis belongs to the requesting user
        if analysis.get("user_id") != user_id:
            return None, None
        return str(analysis["prediction"]), float(analysis["confidence"])

    prediction = payload.get("prediction")
    confidence = payload.get("confidence")
    if prediction is None or confidence is None:
        return None, None

    return str(prediction), normalize_confidence(confidence)


def normalize_confidence(confidence: Any) -> float:
    value = float(confidence)
    if 0 <= value <= 1:
        value *= 100
    return round(value, 2)


def error_response(message: str, status_code: int):
    response = jsonify({"error": message})
    response.status_code = status_code
    return response


# ── Entry point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.run(host=os.getenv("FLASK_HOST", "0.0.0.0"), port=int(os.getenv("PORT", "5000")))