from __future__ import annotations
from datetime import datetime, UTC
import json
import os
import sys
import uuid
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from extensions import db
from auth import auth_bp, token_required


PROJECT_ROOT = Path(__file__).resolve().parent
SRC_DIR = PROJECT_ROOT / "src"
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", PROJECT_ROOT / "uploads"))
load_dotenv(PROJECT_ROOT / ".env")
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_CONTENT_LENGTH = 8 * 1024 * 1024

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from gemini_helper import ask_question, generate_report  # noqa: E402
from predict import predict_cataract  # noqa: E402

app = Flask(__name__)

app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
app.config["UPLOAD_FOLDER"] = str(UPLOAD_DIR)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

app.register_blueprint(auth_bp)

with app.app_context():
    db.create_all()

# In-memory convenience cache for follow-up questions during local development.
ANALYSES: dict[str, dict[str, Any]] = {}
CHAT_SESSIONS: dict[str, dict[str, Any]] = {}

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = os.getenv("CORS_ORIGIN", "*")
    response.headers["Access-Control-Allow-Headers"] = (
        "Content-Type, Authorization"
    )
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


@app.get("/")
def index():
    return jsonify(
        {
            "message": "Cataract detector API is running.",
            "endpoints": {
    "register": "POST /api/auth/register",
    "login": "POST /api/auth/login",
    "logout": "POST /api/auth/logout",
    "me": "GET /api/auth/me",
    "analyze": "POST /api/analyze",
    "chat": "POST /api/chat",
    "sessions": "GET /api/sessions",
    "chat_history": "GET /api/chat-history/<session_id>",
    "delete_session": "DELETE /api/sessions/<session_id>",
    "health": "GET /api/health"
}
        }
    )


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/analyze")
@token_required
def analyze_image(current_user):
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
        username = current_user.username

        language = request.form.get(
            "language",
            "English"
        )
        report = generate_report(
            username,
            prediction,
            confidence_percent,
            symptoms,
            language
        )
        report = generate_report(prediction, confidence_percent, symptoms)
    except Exception as exc:
        return error_response(str(exc), 500)

    analysis_id = uuid.uuid4().hex
    session_id = uuid.uuid4().hex
    analysis = {
        "analysis_id": analysis_id,
        "session_id": session_id,
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
    CHAT_SESSIONS[session_id] = {
        "user_id": current_user.id,
        "session_id": session_id,
        "title": f"{username} - {datetime.now().strftime('%d-%m %H:%M')}",
        "username": username,
        "prediction": prediction,
        "confidence": confidence_percent,
        "report": report,
        "language": language,
        "created_at": datetime.now(UTC).isoformat(),
        "messages": [
    {
        "role": "assistant",
        "content": report,
        "timestamp": datetime.now(UTC).isoformat()
    }
]
    }
    return jsonify(analysis)


@app.get("/api/chat-history/<session_id>")
@token_required
def get_chat_history(current_user, session_id):
    if session_id not in CHAT_SESSIONS:
        return error_response(
            "Invalid session_id.",
            404
        )

    session = CHAT_SESSIONS[session_id]
    if session["user_id"] != current_user.id:
        return error_response(
            "Unauthorized",
            403
        )

    return jsonify(
        {
            "session_id": session_id,
            "messages": session["messages"],
            "prediction": session["prediction"],
            "confidence": session["confidence"],
            "report": session["report"]
        }
    )
@app.delete("/api/sessions/<session_id>")
@token_required
def delete_session(current_user, session_id):

    if session_id not in CHAT_SESSIONS:
        return error_response(
            "Invalid session_id.",
            404
        )

    session = CHAT_SESSIONS[session_id]

    if session["user_id"] != current_user.id:
        return error_response(
            "Unauthorized",
            403
        )

    del CHAT_SESSIONS[session_id]

    return jsonify(
        {
            "message": "Session deleted successfully."
        }
    )
@app.post("/api/chat")
@token_required
def chat(current_user):
    payload = request.get_json(silent=True) or {}

    question = str(
        payload.get("question", "")
    ).strip()

    session_id = str(
        payload.get("session_id", "")
    ).strip()

    if not question:
        return error_response(
            "Question is required.",
            400
        )

    if session_id not in CHAT_SESSIONS:
        return error_response(
            "Invalid session_id.",
            400
        )

    session = CHAT_SESSIONS[session_id]

    if session["user_id"] != current_user.id:
        return error_response(
            "Unauthorized",
            403
        )

    prediction = session["prediction"]
    confidence = session["confidence"]

    session["messages"].append(
        {
            "role": "user",
            "content": question,
            "timestamp": datetime.now(UTC).isoformat()
        }
    )

    try:

        recent_messages = session["messages"][-20:]

        answer = ask_question(
            question,
            prediction,
            confidence,
            session["language"],
            recent_messages
        )

        session["messages"].append(
            {
                "role": "assistant",
                "content": answer,
                "timestamp": datetime.now(UTC).isoformat()
            }
        )

    except Exception as exc:
        return error_response(
            str(exc),
            500
        )

    return jsonify(
        {
            "session_id": session["session_id"],
            "title": session["title"],
            "username": session["username"],
            "created_at": session["created_at"],
            "prediction": session["prediction"],
            "confidence": session["confidence"],
            "report": session["report"],
            "messages": session["messages"]
        }
    )
@app.get("/api/sessions")
@token_required
def get_sessions(current_user):

    sessions = []

    for session in CHAT_SESSIONS.values():

        if session["user_id"] != current_user.id:
            continue
        sessions.append(
            {
                "session_id": session["session_id"],
                "title": session["title"],
                "prediction": session["prediction"],
                "confidence": session["confidence"],
                "created_at": session["created_at"]
            }
        )

    return jsonify(sessions)
@app.get("/uploads/<path:filename>")
def uploaded_file(filename: str):
    return send_from_directory(UPLOAD_DIR, filename)


@app.errorhandler(413)
def file_too_large(_error):
    return error_response("Uploaded image is too large. Maximum size is 8 MB.", 413)


@app.errorhandler(404)
def not_found(_error):
    return error_response("Route not found.", 404)


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


def get_chat_context(payload: dict[str, Any]) -> tuple[str | None, float | None]:
    analysis_id = payload.get("analysis_id")
    if analysis_id and analysis_id in ANALYSES:
        analysis = ANALYSES[str(analysis_id)]
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


if __name__ == "__main__":
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.run(host=os.getenv("FLASK_HOST", "0.0.0.0"), port=int(os.getenv("PORT", "5000")))