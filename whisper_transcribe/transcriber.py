import whisper
import os

model = whisper.load_model("medium")

def transcribe_audio(file_path):
    """
    Transcribes audio and returns the text and detected language.
    """
    result = model.transcribe(file_path, fp16=False) # Set to True if on GPU
    # Return both the text and the language code (e.g., 'en', 'es')
    return result['text'], result['language']