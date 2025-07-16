let mediaRecorder;
let audioChunks = [];

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const questionId = document.getElementById("question").value;
      const formData = new FormData();
      formData.append("audio", audioBlob, "answer.wav");
      formData.append("question_id", questionId);

      document.getElementById("status").innerText = "Uploading...";

      fetch("/upload", {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        document.getElementById("status").innerText = "Done!";
        document.getElementById("transcript").innerText = data.transcript;
        document.getElementById("score").innerText = data.score;
        document.getElementById("feedback").innerText = data.feedback;
      });
    };

    mediaRecorder.start();
    document.getElementById("status").innerText = "Recording...";
  });
}

function stopRecording() {
  mediaRecorder.stop();
  document.getElementById("status").innerText = "Stopped. Processing...";
}
