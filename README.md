# Mock Interview AI 🤖

An interactive web application that simulates a mock interview using AI. The application features a voice-enabled AI interviewer, provides real-time feedback on verbal answers, and analyzes the user's on-camera body language for emotional cues.

---

## ## Features

* **Interactive UI:** A full-screen, split-panel interface with a talking AI avatar and a live user video feed.
* **Voice-Enabled AI:** The interviewer asks questions out loud using browser-based Text-to-Speech (TTS).
* **Dynamic Sessions:** Choose between "Technical" and "HR" domains, with 5 random questions asked per session.
* **Answer Scoring:** Uses a BERT-based model to score answers based on semantic similarity to expected keywords.
* **Body Language Analysis:** Utilizes OpenCV and DeepFace to analyze the user's video for dominant emotions and provides feedback on confidence and composure.
* **Robust Input Handling:** Includes checks for empty answers and non-English responses, prompting the user to try again.

---

## ## Tech Stack

* **Backend:** Python, Flask
* **Frontend:** HTML, CSS, JavaScript
* **Speech-to-Text:** OpenAI's Whisper
* **NLP Model:** PyTorch, Hugging Face Transformers (BERT)
* **Computer Vision:** OpenCV, DeepFace

---

## ## Setup and Installation

1.  **Clone the repository:**
    ```sh
    git https://github.com/Mugilan1309/Mock_Interview_AI.git
    cd Mock_Interview_AI
    ```

2.  **Install Python dependencies:**
    ```sh
    pip install -r requirements.txt
    ```

3.  **Install FFmpeg:**
    * This project requires **FFmpeg**. Ensure it is installed on your system and accessible in your system's PATH. You can download it from [ffmpeg.org](https://ffmpeg.org/download.html).

4.  **Run the application:**
    ```sh
    python app.py
    ```

5.  Open your web browser and navigate to `http://127.0.0.1:5000`.
