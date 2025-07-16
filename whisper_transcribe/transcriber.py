import whisper
import os

model = whisper.load_model("base")  # You can use 'small' if GPU available

def transcribe_audio(file_path):
    result = model.transcribe(file_path)
    return result['text']
