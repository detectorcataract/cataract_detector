from __future__ import annotations
import json
import os
import sys
import uuid
from pathlib import Path
from PIL import Image, UnidentifiedImageError

from flask import Flask, jsonify, request, send_from_directory, url_for
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / "src" /".env")

from extensions import db
from auth import auth_bp, token_required, ChatSession, ChatMessage

SRC_DIR = PROJECT_ROOT / "src"
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", PROJECT_ROOT / "uploads"))
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_CONTENT_LENGTH = 8 * 1024 * 1024

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from gemini_helper import ask_question, generate_report, translate_text, ASSESSMENT_QUESTIONS  # noqa: E402
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

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = os.getenv("CORS_ORIGIN", "*")
    response.headers["Access-Control-Allow-Headers"] = (
        "Content-Type, Authorization"
    )
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS,PUT,DELETE"
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

    try:
        with Image.open(image_path) as img:
            img.verify()  # catches corrupted/non-image files
    except (UnidentifiedImageError, Exception):
        image_path.unlink(missing_ok=True)  # clean up the saved file
        return error_response("Uploaded file is not a valid image.", 400)

    try:
        with Image.open(image_path) as img:
            if img.format not in ("JPEG", "PNG", "WEBP"):
                image_path.unlink(missing_ok=True)
                return error_response("Only JPG, PNG, and WebP images are supported.", 400)
    except Exception:
        image_path.unlink(missing_ok=True)
        return error_response("Could not read the uploaded image.", 400)

    try:
        prediction_result = predict_cataract(image_path)
        prediction = str(prediction_result["label"])
        confidence_percent = round(float(prediction_result["confidence"]) * 100, 2)

    except Exception as exc:
        try:
            if image_path.exists():
                image_path.unlink()

        except Exception:
            pass

        return error_response(str(exc), 500)

    session_id = uuid.uuid4().hex

    chat_session = ChatSession(
        session_id=session_id,
        user_id=current_user.id,
        title=None,
        prediction=prediction,
        confidence=confidence_percent,
        report=None,
        language=None,
        image_url=url_for(
            "uploaded_file",
            filename=stored_filename,
        ),
        patient_name=None,
    )

    db.session.add(chat_session)
    db.session.commit()

    greeting_message = ChatMessage(
        session_id=chat_session.id,
        role="assistant",
        content="Hi! I'm your EyeCare Assistant. I've analysed your image."
    )
    db.session.add(greeting_message)

    assistant_message = ChatMessage(
        session_id=chat_session.id,
        role="assistant",
        content="Please enter patient's name"
    )

    db.session.add(assistant_message)
    db.session.commit()

    analysis = {
        "session_id": session_id,
        "image": {
            "filename": stored_filename,
            "url": f"/uploads/{stored_filename}",
        },
        "prediction": prediction,
        "confidence": confidence_percent,
        "symptoms": [],
        "report": None,
        "raw_prediction": prediction_result,
    }

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
            "assessment_completed":session.assessment_completed,
            "current_question":session.current_question,
            "patient_name":session.patient_name,
            "language":session.language,
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

    if not chat_session.assessment_completed:
        return error_response(
            "Please complete the assessment first.",
            400
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
        try:
            symptoms = json.loads(
                chat_session.symptoms or "[]"
            )
        except Exception:
            symptoms = []

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
            symptoms,
            chat_session.language,
            recent_messages,
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
@token_required
def uploaded_file(current_user, filename: str):
    # Verify the requesting user owns a session that references this image
    session = ChatSession.query.filter(
        ChatSession.user_id == current_user.id,
        ChatSession.image_url.like(f"%{filename}%")
    ).first()

    if session is None:
        return error_response("Not found.", 404)

    return send_from_directory(UPLOAD_DIR, filename)


@app.errorhandler(413)
def file_too_large(_error):
    return error_response("Uploaded image is too large. Maximum size is 8 MB.", 413)


@app.errorhandler(404)
def not_found(_error):
    return error_response("Route not found.", 404)

@app.post("/api/language")
@token_required
def save_language(current_user):

    payload = request.get_json(silent=True) or {}

    session_id = str(
        payload.get("session_id", "")
    ).strip()

    language = str(
        payload.get("language", "")
    ).strip()

    if not language:
        return error_response(
            "Language is required.",
            400
        )

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

    chat_session.language = language

    user_message = ChatMessage(
        session_id=chat_session.id,
        role="user",
        content=language
    )

    db.session.add(user_message)

    db.session.commit()

    return jsonify(
        {
            "success": True,
            "language": language
        }
    )

@app.get("/api/assessment/<session_id>")
@token_required
def get_assessment_question(current_user, session_id):

    chat_session = ChatSession.query.filter_by(
        session_id=session_id
    ).first()

    if chat_session is None:
        return error_response("Session not found.", 404)

    if chat_session.user_id != current_user.id:
        return error_response("Unauthorized", 403)

    current_question = chat_session.current_question

    if current_question >= len(ASSESSMENT_QUESTIONS):
        return jsonify({"completed": True, "message": "Assessment completed."})

    question = ASSESSMENT_QUESTIONS[current_question]["question"]

    translated_question = translate_text(
        question,
        chat_session.language or "English"
    )

    if not chat_session.current_question_persisted:
        assistant_message = ChatMessage(
            session_id=chat_session.id,
            role="assistant",
            content=translated_question
        )
        db.session.add(assistant_message)
        chat_session.current_question_persisted = True
        db.session.commit()

    return jsonify({
        "completed": False,
        "question_number": current_question + 1,
        "total_questions": len(ASSESSMENT_QUESTIONS),
        "question": translated_question
    })
@app.post("/api/assessment")
@token_required
def submit_assessment(current_user):

    payload = request.get_json(silent=True) or {}

    session_id = str(
        payload.get("session_id", "")
    ).strip()

    answer = str(
        payload.get("answer", "")
    ).strip().upper()

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

    if answer not in ["Y", "N"]:
        return error_response(
            "Answer must be Y or N.",
            400
        )

    current_question = chat_session.current_question

    if current_question >= len(ASSESSMENT_QUESTIONS):
        return jsonify(
            {
                "completed": True,
                "report": chat_session.report,
            }
        )

    question_data = ASSESSMENT_QUESTIONS[
        current_question
    ]
    try:
        symptoms = json.loads(
            chat_session.symptoms or "[]"
        )
    except Exception:
        symptoms = []

    if answer == "Y":
        symptoms.append(
            question_data["symptom"]
        )

    user_message = ChatMessage(
        session_id=chat_session.id,
        role="user",
        content=answer
    )

    db.session.add(user_message)

    chat_session.symptoms = json.dumps(
        symptoms
    )

    chat_session.current_question += 1
    chat_session.current_question_persisted = False

    if chat_session.current_question >= len(
        ASSESSMENT_QUESTIONS
    ):
        report = generate_report(
            chat_session.patient_name,
            chat_session.prediction,
            chat_session.confidence,
            symptoms,
            chat_session.language or "English"
        )

        chat_session.report = report
        chat_session.assessment_completed = True

        assistant_message = ChatMessage(
            session_id=chat_session.id,
            role="assistant",
            content=report
        )

        db.session.add(assistant_message)
        db.session.commit()

        return jsonify(
            {
                "completed": True,
                "report": report
            }
        )

    next_question = ASSESSMENT_QUESTIONS[
        chat_session.current_question
    ]["question"]

    translated_question = translate_text(
        next_question,
        chat_session.language or "English"
    )

    assistant_message = ChatMessage(
        session_id=chat_session.id,
        role="assistant",
        content=translated_question
    )

    db.session.add(assistant_message)

    db.session.commit()

    return jsonify(
        {
            "completed": False,
            "question_number": chat_session.current_question + 1,
            "total_questions": len(ASSESSMENT_QUESTIONS),
            "question": translated_question
        }
    )

@app.post("/api/patient-name")
@token_required
def save_patient_name(current_user):

    payload = request.get_json(silent=True) or {}

    session_id = str(
        payload.get("session_id", "")
    ).strip()

    patient_name = str(
        payload.get("patient_name", "")
    ).strip()

    if not patient_name:
        return error_response(
            "Patient name is required.",
            400
        )

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

    chat_session.patient_name = patient_name

    chat_session.title = (
        f"{patient_name} - "
        f"{chat_session.created_at.strftime('%d-%m %H:%M')}"
    )

    user_message = ChatMessage(
        session_id=chat_session.id,
        role="user",
        content=patient_name
    )

    assistant_message = ChatMessage(
        session_id=chat_session.id,
        role="assistant",
        content="Please enter your preferred language."
    )

    db.session.add(user_message)
    db.session.add(assistant_message)

    db.session.commit()

    return jsonify(
        {
            "success": True,
            "patient_name": patient_name,
            "title": chat_session.title
        }
    )



def is_allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def build_stored_filename(filename: str) -> str:
    safe_name = secure_filename(filename)
    suffix = Path(safe_name).suffix.lower()
    return f"{uuid.uuid4().hex}{suffix}"

def error_response(message: str, status_code: int):
    response = jsonify({"error": message})
    response.status_code = status_code
    return response


if __name__ == "__main__":
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.run(host=os.getenv("FLASK_HOST", "0.0.0.0"), port=int(os.getenv("PORT", "5000")))