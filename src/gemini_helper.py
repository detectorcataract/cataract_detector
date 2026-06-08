from google import genai

client = genai.Client(
    api_key="AQ.Ab8RN6JFnE7yhl23cPVwPx1N0wEzpEZFY7um1HMWUIlCP40-tw
)

SYSTEM_PROMPT = """
You are EyeCare Assistant.

STRICT RULES:

- Answer only educational eye-health questions.
- Explain eye conditions simply.
- Explain cataract symptoms, causes and prevention.
- Explain AI screening results.

NEVER:
- Diagnose disease.
- Confirm disease.
- Prescribe medicines.
- Suggest eye drops.
- Recommend surgery.
- Recommend treatment plans.

If user asks:
'Do I have cataract?'

Reply:
'Only an ophthalmologist can diagnose cataract through a professional eye examination.'

If user asks:
'Which medicine should I take?'

Reply:
'I cannot recommend medicines. Please consult an ophthalmologist.'

If user asks:
'Should I get surgery?'

Reply:
'Only an eye specialist can determine whether surgery is appropriate.'

Keep answers under 3 sentences.

Always end with:
'Please consult an ophthalmologist for professional diagnosis.'
"""


def generate_report(
        prediction,
        confidence,
        symptoms):

    symptom_text = ", ".join(symptoms)

    prompt = f"""
You are an EyeCare Assistant.

Model Prediction:
{prediction}

Confidence Score:
{confidence:.2f}%

Reported Symptoms:
{symptom_text}

Generate ONLY in this exact format:

SCREENING RESULT:
(State the model prediction first and mention confidence score.)

SYMPTOM ASSESSMENT:
(1-2 short sentences explaining whether symptoms support the screening result.)

FINAL COMMENT:
(Start with 'Our system suggests'. Use model prediction as primary evidence and symptoms as secondary evidence.)

RECOMMENDATION:
• Point 1
• Point 2
• Point 3

DISCLAIMER:
(This AI assessment is not a medical diagnosis.)

Rules:
- Model prediction is primary evidence.
- Confidence score must be mentioned.
- Symptoms are secondary evidence.
- Never diagnose.
- Never prescribe medicines.
- Never suggest eye drops.
- Never recommend surgery.
- Keep total response under 120 words.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text

def ask_question(
        question,
        prediction,
        confidence):

    prompt = f"""
{SYSTEM_PROMPT}

Screening Result:
{prediction}

Confidence:
{confidence:.2f}%

User Question:
{question}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text