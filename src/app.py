from __future__ import annotations
from datetime import datetime, UTC
import json
import os
import sys
import uuid
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory, url_for
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from extensions import db
from auth import auth_bp, token_required, User, ChatSession, ChatMessage

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
        username = current_user.email

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
    except Exception as exc:
        return error_response(str(exc), 500)

    analysis_id = uuid.uuid4().hex
    session_id = uuid.uuid4().hex

    chat_session = ChatSession(
        session_id=session_id,
        user_id=current_user.id,
        title=f"{username} - {datetime.now().strftime('%d-%m %H:%M')}",
        prediction=prediction,
        confidence=confidence_percent,
        report=report,
        language=language,
        image_url=url_for(
            "uploaded_file",
            filename=stored_filename,
            _external=True
        ),
    )

    db.session.add(chat_session)
    db.session.commit()

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

    return jsonify(analysis)


@app.get("/api/chat-history/<session_id>")
@token_required
def get_chat_history(current_user, session_id):

    session = ChatSession.query.filter_by(
        session_id=session_id,
        user_id=current_user.id
    ).first()

    if not session:
        return error_response(
            "Invalid session_id.",
            404
        )

    messages = (
        ChatMessage.query
        .filter_by(session_id=session.id)
        .order_by(ChatMessage.id.asc())
        .all()
    )

    return jsonify(
        {
            "session_id": session.session_id,
            "prediction": session.prediction,
            "confidence": session.confidence,
            "report": session.report,
            "image_url": session.image_url,
            "messages": [
                {
                    "role": m.role,
                    "content": m.content,
                    "timestamp": m.timestamp.isoformat()
                }
                for m in messages
            ]
        }
    )
@app.delete("/api/sessions/<session_id>")
@token_required
def delete_session(current_user, session_id):

    chat_session = ChatSession.query.filter_by(
        session_id=session_id
    ).first()

    if chat_session is None:
        return error_response(
            "Session not found.",
            404
        )

    if chat_session.user_id != current_user.id:
        return error_response(
            "Unauthorized",
            403
        )

    db.session.delete(chat_session)
    db.session.commit()

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

    chat_session = ChatSession.query.filter_by(
        session_id=session_id
    ).first()

    if chat_session is None:
        return error_response(
            "Chat session not found in database.",
            404
        )

    if chat_session.user_id != current_user.id:
        return error_response(
            "Unauthorized",
            403
        )

    prediction = chat_session.prediction
    confidence = chat_session.confidence

    user_message = ChatMessage(
        session_id=chat_session.id,
        role="user",
        content=question,
    )

    db.session.add(user_message)

    try:
        recent_messages = [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat()
            }
            for msg in chat_session.messages
        ][-20:]

        answer = ask_question(
            question,
            prediction,
            confidence,
            chat_session.language,
            recent_messages
        )

        assistant_message = ChatMessage(
            session_id=chat_session.id,
            role="assistant",
            content=answer,
        )

        db.session.add(assistant_message)
        db.session.commit()


    except Exception as exc:
        db.session.rollback()
        return error_response(
            str(exc),
            500
        )

    db.session.commit()

    return jsonify(
        {
            "answer": answer,
            "session_id": chat_session.session_id,
            "title": chat_session.title,
            "created_at": chat_session.created_at.isoformat(),
            "prediction": chat_session.prediction,
            "confidence": chat_session.confidence,
            "report": chat_session.report,
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat()
                }
                for msg in chat_session.messages
            ]
        }
    )
@app.get("/api/sessions")
@token_required
def get_sessions(current_user):

    sessions = (
        ChatSession.query
        .filter_by(user_id=current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )

    return jsonify([
        {
            "session_id": s.session_id,
            "title": s.title,
            "prediction": s.prediction,
            "confidence": s.confidence,
            "created_at": s.created_at.isoformat(),
        }
        for s in sessions
    ])
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