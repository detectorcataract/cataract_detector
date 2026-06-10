import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = None

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
def get_client():
    global client

    if client is None:

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY not found in .env file"
            )

        client = genai.Client(
            api_key=api_key
        )

    return client
def ask_gemini(prompt):

    try:

        response = get_client().models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return response.text

    except Exception as e:

        print(f"\nGemini Error: {e}")

        return (
            "Service temporarily unavailable. "
            "Please try again later."
        )
def translate_questions(
    questions,
    language
):
    if language.lower() in [
        "english",
        "en",
        "eng"
    ]:
        return questions

    prompt = f"""
    Translate the following eye assessment questions into {language}.

    Rules:
    - Translate only.
    - Keep the meaning unchanged.
    - Return one translated question per line.
    - Do not add numbering.
    - Do not add explanations.

    Questions:
    {chr(10).join(questions)}
    """

    response = ask_gemini(prompt)

    translated_questions = [
        line.strip()
        for line in response.splitlines()
        if line.strip()
    ]

    if len(translated_questions) != len(questions):
        return questions

    return translated_questions

def generate_report(
    username,
    prediction,
    confidence,
    symptoms,
    language
):

    symptom_text = ", ".join(symptoms)

    if not symptoms:
        symptom_text = "No symptoms reported."

    prompt = f"""
    {SYSTEM_PROMPT}

    Selected Language:
    {language}

    Important:
    Generate the entire report only in {language}.
    
    User Name:
    {username}

    AI Prediction:
    {prediction}

    Confidence:
    {confidence}%

    Reported Symptoms:
    {symptom_text}

    Generate a professional eye screening report.

Sections:

1. Patient Information
   - User Name
   - Screening Result
   - Confidence Score

2. AI Prediction Summary

3. Reported Symptoms

4. Assessment Correlation
   - Compare the reported symptoms with the AI prediction.
   - Explain whether they appear consistent.

5. Educational Guidance

6. Eye Care Precautions

7. Disclaimer

Rules:
- Do not diagnose any disease.
- Do not confirm any disease.
- Do not prescribe medication.
- Do not recommend surgery.
- Do not provide treatment plans.
- Use professional but simple language.
- Keep the report under 300 words.
- Format the report clearly with headings.
    """

    report = ask_gemini(prompt)

    if report == (
            "Service temporarily unavailable. "
            "Please try again later."
    ):
        return f"""
    SCREENING REPORT

    User: {username}

    Prediction:
    {prediction}

    Confidence:
    {confidence}%

    Reported Symptoms:
    {symptom_text}

    AI report could not be generated at this time.

    This platform is intended for screening and educational purposes only.
    Please consult an ophthalmologist for professional evaluation.
    """

    return report
def ask_question(
    question,
    prediction,
    confidence,
    report,
    language,
    chat_history
):
    history_text = ""

    for message in chat_history[-20:]:
        history_text += (
            f"{message.get('role', 'unknown')}: "
            f"{message.get('content', '')}\n"
        )
    prompt = f"""
    {SYSTEM_PROMPT}

    Selected Language:
    {language}

    Important:
    Answer only in {language}.

    AI Prediction:
    {prediction}

    Confidence:
    {confidence}%

    Screening Report:
{report}

Chat History:
{history_text}

User Question:
{question}

    Answer in simple language.

    Rules:
    - Do not diagnose.
    - Do not prescribe medication.
    - Do not recommend surgery.
    - Educational information only.
    - End every response with a short disclaimer.

    Disclaimer:
    This platform is intended for screening and educational purposes only.
    Please consult an ophthalmologist for professional evaluation.

    Also remind the user:
    Type 'exit' to end the chat.
    """

    return ask_gemini(prompt)
