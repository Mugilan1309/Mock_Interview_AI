from flask import Flask, render_template, request, jsonify
import os
import json
import random
from whisper_transcribe.transcriber import transcribe_audio
from models.bert_model import score_answer, generate_feedback
from vision_analyzer import analyze_body_language

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
# Let's define how many questions we want per interview
QUESTIONS_PER_INTERVIEW = 5

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load the entire question bank
with open("question_bank.json", "r") as f:
    question_bank = json.load(f)

# Helper function to find a question by its ID in the new structure
def find_question_by_id(question_id):
    for domain in question_bank:
        for question in question_bank[domain]:
            if question["id"] == question_id:
                return question
    return None

@app.route("/")
def index():
    # Pass the list of domain names to the template
    domains = list(question_bank.keys())
    return render_template("index.html", domains=domains)

@app.route("/start-interview", methods=["POST"])
def start_interview():
    domain = request.json['domain']
    if domain in question_bank:
        # Get all questions for the selected domain
        questions_in_domain = question_bank[domain]
        # Randomly select a few questions, ensuring we don't ask for more than available
        num_to_select = min(QUESTIONS_PER_INTERVIEW, len(questions_in_domain))
        selected_questions = random.sample(questions_in_domain, num_to_select)
        return jsonify(selected_questions)
    return jsonify({"error": "Domain not found"}), 404

# No changes needed to your imports or other functions

@app.route("/upload", methods=["POST"])
def upload():
    # 1. Expect a 'video' file from the frontend
    video_file = request.files.get('video')
    question_id = int(request.form.get('question_id'))

    if not video_file or not question_id:
        return jsonify({"error": "Missing video file or question ID"}), 400

    # 2. Save the video file with its original extension (e.g., .webm)
    save_path = os.path.join(UPLOAD_FOLDER, video_file.filename)
    video_file.save(save_path)
    
    question_data = find_question_by_id(question_id)
    if not question_data:
        return jsonify({"error": "Question not found"}), 404
        
    # --- Analysis Pipeline ---
    # The analyzer and transcriber both work directly on the saved video file
    body_language_feedback = analyze_body_language(save_path)
    transcribed, language = transcribe_audio(save_path)

    # Handle retry cases
    if not transcribed or not transcribed.strip():
        return jsonify({
            "status": "no_answer",
            "feedback": "No answer was detected. Please try recording again."
        })
    
    if language != 'en':
        return jsonify({
            "status": "wrong_language",
            "transcript": transcribed,
            "feedback": "Please answer in English. It seems you might have used another language."
        })
    
    # Process the valid answer
    expected_keywords = question_data["expected_keywords"]
    score = score_answer(transcribed, expected_keywords)
    feedback = generate_feedback(score)
    
    # 3. Add the new body_language_feedback to the final response
    return jsonify({
        "status": "success",
        "transcript": transcribed,
        "score": score,
        "feedback": feedback,
        "body_language_feedback": body_language_feedback
    })

if __name__ == "__main__":
    app.run(debug=True)