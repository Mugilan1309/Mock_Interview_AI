// Global state variables
let mediaRecorder;
let audioChunks = [];
let interviewQuestions = [];
let currentQuestionIndex = 0;
let totalScores = 0;

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

/**
 * Kicks off the interview by fetching questions for the selected domain.
 */
async function startInterview() {
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

    // Switch from domain selection view to interview view
    domainSelectionDiv.style.display = "none";
    interviewScreenDiv.style.display = "block";
    
    askNextQuestion();
  } catch (error) {
    statusElem.innerText = `Error: ${error.message}`;
  }
}

/**
 * Displays the next question or ends the interview if all questions are answered.
 */
function askNextQuestion() {
  // Hide previous results and the "Next" button
  resultsDiv.style.display = "none";
  nextBtn.style.display = "none";

  if (currentQuestionIndex < interviewQuestions.length) {
    const question = interviewQuestions[currentQuestionIndex];
    questionTextElem.innerText = question.question;
    questionCounterElem.innerText = `Question ${currentQuestionIndex + 1} of ${interviewQuestions.length}`;
    statusElem.innerText = "Ready to record your answer.";

    // Reset buttons for the new question
    startBtn.disabled = false;
    stopBtn.disabled = true;

    currentQuestionIndex++;
  } else {
    // End of the interview
    showSummary();
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

/**
 * Starts the audio recording process.
 */
function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = uploadAndProcessAudio;

    mediaRecorder.start();
    statusElem.innerText = "Recording...";
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });
}

/**
 * Stops the audio recording. The onstop event will trigger the upload.
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

  statusElem.innerText = "Processing your answer...";
  stopBtn.disabled = true;

  try {
    const res = await fetch("/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed.");
    
    const data = await res.json();
    
    if (data.status === 'no_answer') {
      statusElem.innerText = data.feedback;
      resultsDiv.style.display = "none";
      startBtn.disabled = false;
      stopBtn.disabled = true;
      return; 
    } 
    // --- ADD THIS BLOCK ---
    else if (data.status === 'wrong_language') {
      statusElem.innerText = data.feedback;
      // Show the incorrect transcript to the user for context
      document.getElementById("transcript").innerText = `Detected: "${data.transcript}"`;
      resultsDiv.style.display = "block"; // Show the results div to display the transcript
      document.getElementById("score").innerText = "N/A"; // Show score is not applicable
      document.getElementById("feedback").innerText = data.feedback; // Repeat feedback
      nextBtn.style.display = "none"; // Hide the next button
      // Re-enable recording
      startBtn.disabled = false;
      stopBtn.disabled = true;
      return;
    }
    // --- END OF BLOCK ---

    // This part only runs on a successful answer
    document.getElementById("transcript").innerText = data.transcript;
    document.getElementById("score").innerText = data.score;
    document.getElementById("feedback").innerText = data.feedback;
    resultsDiv.style.display = "block";
    
    totalScores += data.score;
    nextBtn.style.display = "block"; 
    statusElem.innerText = "Feedback received.";

  } catch (error) {
    statusElem.innerText = `Error: ${error.message}`;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}