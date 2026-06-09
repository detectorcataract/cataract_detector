from gemini_helper import generate_report
from gemini_helper import ask_question

# ==========================================
# MODEL OUTPUT (TEMPORARY VALUES)
# ==========================================

prediction = "Signs Associated with Cataract Detected"
confidence = 96.40

# ==========================================
# WELCOME
# ==========================================

print("\n" + "=" * 60)
print("EYE HEALTH ASSESSMENT")
print("=" * 60)

print(f"\nPrediction: {prediction}")
print(f"Confidence: {confidence}%")

# ==========================================
# SYMPTOM SURVEY
# ==========================================

questions = [
    "Blurred Vision",
    "Cloudy Vision",
    "Difficulty Seeing at Night",
    "Sensitivity to Light",
    "Halos Around Lights"
]

symptoms = []

print("\nPlease answer the following questions:")

for question in questions:

    answer = input(f"\n{question}? (yes/no): ").strip().lower()

    if answer in ["yes", "y"]:
        symptoms.append(question)

# ==========================================
# GENERATE SCREENING REPORT
# ==========================================

print("\nGenerating Report...\n")

report = generate_report(
    prediction,
    confidence,
    symptoms
)

print("=" * 60)
print("SCREENING REPORT")
print("=" * 60)

print(report)

# ==========================================
# CHATBOT SECTION
# ==========================================

print("\n" + "=" * 60)
print("EYECARE ASSISTANT")
print("=" * 60)

print("""
Examples:
- What is cataract?
- What causes cataract?
- Can cataract affect night vision?
- How is cataract detected?
- What do my results mean?

Type 'exit' to quit.
""")

while True:

    question = input("\nYou: ").strip()

    if question.lower() == "exit":

        print("\nThank you for using EyeCare Assistant.")
        break

    try:

        answer = ask_question(
            question,
            prediction,
            confidence
        )

        print("\nBot:")
        print(answer)

    except Exception as e:

        print("\nError:")
        print(e)