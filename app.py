from flask import Flask, render_template, request, jsonify
import os
import json
from whisper_transcribe.transcriber import transcribe_audio
from models.bert_model import score_answer, generate_feedback

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

with open("question_bank.json", "r") as f:
    question_bank = json.load(f)

@app.route("/")
def index():
    return render_template("index.html", questions=question_bank)

@app.route("/upload", methods=["POST"])
def upload():
    audio_file = request.files['audio']
    question_id = int(request.form['question_id'])

    save_path = os.path.join(UPLOAD_FOLDER, audio_file.filename)
    audio_file.save(save_path)

    transcribed = transcribe_audio(save_path)
    expected_keywords = next(q["expected_keywords"] for q in question_bank if q["id"] == question_id)

    score = score_answer(transcribed, expected_keywords)
    feedback = generate_feedback(score)

    return jsonify({
        "transcript": transcribed,
        "score": score,
        "feedback": feedback
    })

if __name__ == "__main__":
    app.run(debug=True)
