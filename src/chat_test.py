from gemini_helper import generate_report
from gemini_helper import ask_question

# ==========================================
# THESE VALUES WILL COME FROM YOUR MODEL
# ==========================================

prediction = "Signs Associated with Cataract Detected"
confidence = 96.40

# ==========================================
# SYMPTOM SURVEY
# ==========================================

print("\nEYE HEALTH ASSESSMENT\n")

questions = [
    "Blurred Vision",
    "Cloudy Vision",
    "Difficulty Seeing at Night",
    "Sensitivity to Light",
    "Halos Around Lights"
]

symptoms = []

for q in questions:

    ans = input(f"{q}? (yes/no): ")

    if ans.lower() in ["yes", "y"]:
        symptoms.append(q)

# ==========================================
# FINAL REPORT
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
print("ASK ANY EYE-HEALTH QUESTION")
print("=" * 60)

print("""
Examples:
- What is cataract?
- What causes cataract?
- Can cataract affect night vision?
- How is cataract detected?

Type 'exit' to quit.
""")

while True:

    question = input("\nYou: ")

    if question.lower() == "exit":

        print("\nThank you for using EyeCare Assistant.")
        break

    answer = ask_question(
        question,
        prediction,
        confidence
    )

    print("\nBot:")
    print(answer)yaml