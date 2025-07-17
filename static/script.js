// Global state variables
let mediaRecorder;
let audioChunks = [];
let interviewQuestions = [];
let currentQuestionIndex = 0;
let totalScores = 0;
let userStream; // To hold the camera/mic stream

// UI Elements
const domainSelectionDiv = document.getElementById("domain-selection");
const interviewScreenDiv = document.getElementById("interview-screen");
const summaryScreenDiv = document.getElementById("summary-screen");
const questionTextElem = document.getElementById("question-text");
const questionCounterElem = document.getElementById("question-counter");
const statusElem = document.getElementById("status");
const resultsDiv = document.getElementById("results");
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const nextBtn = document.getElementById("next-btn");
const userVideo = document.getElementById("user-video");
const interviewerAvatar = document.getElementById("interviewer-avatar");

/**
 * Initializes webcam and microphone access and displays the video feed.
 */
async function initMedia() {
    try {
        // Request both video and audio access
        userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        userVideo.srcObject = userStream;
    } catch (err) {
        console.error("Error accessing media devices.", err);
        statusElem.innerText = "Error: Webcam and microphone access is required to start.";
        alert("Webcam and microphone access is required. Please allow access and refresh the page.");
    }
}

/**
 * Reads the question text out loud using the browser's Text-to-Speech API.
 * @param {string} text The text to speak.
 */
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Animate avatar when speaking starts
    utterance.onstart = () => {
        interviewerAvatar.classList.add("speaking");
    };

    // Clean up animation and enable recording when speaking ends
    utterance.onend = () => {
        interviewerAvatar.classList.remove("speaking");
        statusElem.innerText = "Ready for your answer.";
        startBtn.disabled = false; // Enable recording button
    };

    window.speechSynthesis.speak(utterance);
}

/**
 * Kicks off the interview by getting camera access and fetching questions.
 */
async function startInterview() {
    statusElem.innerText = "Accessing camera and microphone...";
    await initMedia(); // Wait for camera/mic access first

    if (!userStream) return; // Stop if media access was denied

    const selectedDomain = document.getElementById("domain").value;
    statusElem.innerText = "Loading interview...";

    try {
        const response = await fetch("/start-interview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain: selectedDomain }),
        });

        if (!response.ok) throw new Error("Failed to start interview.");
        
        interviewQuestions = await response.json();
        if (interviewQuestions.length === 0) {
            statusElem.innerText = "No questions found for this domain.";
            return;
        }

        domainSelectionDiv.style.display = "none";
        interviewScreenDiv.style.display = "flex"; // Use flex for the new layout
        
        askNextQuestion();
    } catch (error) {
        statusElem.innerText = `Error: ${error.message}`;
    }
}

/**
 * Displays the next question and reads it aloud.
 */
function askNextQuestion() {
    resultsDiv.style.display = "none";

    if (currentQuestionIndex < interviewQuestions.length) {
        const question = interviewQuestions[currentQuestionIndex];
        questionTextElem.innerText = question.question;
        questionCounterElem.innerText = `Question ${currentQuestionIndex + 1} of ${interviewQuestions.length}`;
        
        // Disable buttons until the AI is done speaking
        startBtn.disabled = true;
        stopBtn.disabled = true;

        speak(question.question); // Use TTS to ask the question

        currentQuestionIndex++;
    } else {
        showSummary();
    }
}

/**
 * Starts the audio and video recording process.
 */
function startRecording() {
    if (!userStream) {
        alert("Could not access camera and microphone.");
        return;
    }
    // Use the combined stream for the recorder
    mediaRecorder = new MediaRecorder(userStream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = uploadAndProcessAudio;

    mediaRecorder.start();
    statusElem.innerText = "Recording...";
    startBtn.disabled = true;
    stopBtn.disabled = false;
}

/**
 * Stops the audio recording.
 */
function stopRecording() {
    mediaRecorder.stop();
    statusElem.innerText = "Processing your answer...";
    stopBtn.disabled = true;
}

/**
 * Uploads the recorded audio and processes the server's response.
 */
async function uploadAndProcessAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const questionId = interviewQuestions[currentQuestionIndex - 1].id;

    const formData = new FormData();
    formData.append("audio", audioBlob, "answer.wav");
    formData.append("question_id", questionId);

    statusElem.innerText = "Analyzing your answer...";

    try {
        const res = await fetch("/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed.");
        
        const data = await res.json();
        
        if (data.status === 'no_answer' || data.status === 'wrong_language') {
            statusElem.innerText = data.feedback;
            resultsDiv.style.display = "none";
            startBtn.disabled = false;
            stopBtn.disabled = true;
            return; 
        }

        document.getElementById("transcript").innerText = data.transcript;
        document.getElementById("score").innerText = data.score;
        document.getElementById("feedback").innerText = data.feedback;
        resultsDiv.style.display = "block";
        
        totalScores += data.score;
        statusElem.innerText = "Feedback received.";

    } catch (error) {
        statusElem.innerText = `Error: ${error.message}`;
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

/**
 * Displays the final summary screen with the average score.
 */
function showSummary() {
    interviewScreenDiv.style.display = "none";
    summaryScreenDiv.style.display = "block";
    const averageScore = (totalScores / interviewQuestions.length).toFixed(2);
    document.getElementById("final-score").innerText = averageScore;
}