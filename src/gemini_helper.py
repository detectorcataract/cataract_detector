import os
from dotenv import load_dotenv
from google import genai

# Load API key from .env
load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

SYSTEM_PROMPT = """
You are EyeCare Assistant.

Rules:
- Explain eye conditions in simple language.
- Explain cataract symptoms, causes and prevention.
- Explain AI screening results.
- Keep answers concise and easy to understand.

Never:
- Diagnose diseases.
- Confirm diseases.
- Prescribe medicines.
- Recommend surgery.
- Recommend treatment plans.

Always remind users:
This platform is intended for screening and educational purposes only.
Please consult an ophthalmologist for professional evaluation.
"""


def generate_report(prediction, confidence, symptoms):

    symptom_text = ", ".join(symptoms)

    if not symptoms:
        symptom_text = "No symptoms reported"

    prompt = f"""
    {SYSTEM_PROMPT}

    AI Prediction:
    {prediction}

    Confidence:
    {confidence}%

    Symptoms:
    {symptom_text}

    Generate a concise screening report including:

    1. Prediction Summary
    2. Symptom Summary
    3. Educational Guidance
    4. Disclaimer

    Keep the report under 200 words.
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text


def ask_question(question, prediction, confidence):

    prompt = f"""
    {SYSTEM_PROMPT}

    Screening Result:
    {prediction}

    Confidence:
    {confidence}%

    User Question:
    {question}

    Answer in simple language.
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text