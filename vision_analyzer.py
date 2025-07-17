import cv2
from deepface import DeepFace
from collections import Counter
import os

def analyze_body_language(video_path):
    """
    Analyzes a video file to detect the dominant emotion and provides feedback.
    
    Args:
        video_path (str): The path to the video file.

    Returns:
        str: A feedback string based on the analysis.
    """
    if not os.path.exists(video_path):
        return "Video file not found for analysis."

    emotions = []
    try:
        # Open the video file
        cap = cv2.VideoCapture(video_path)
        # Get the frames per second to sample one frame per second
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        
        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Analyze one frame every second
            if frame_count % fps == 0:
                try:
                    # The core analysis function from deepface
                    # It looks for a face and determines the dominant emotion
                    result = DeepFace.analyze(
                        img_path=frame, 
                        actions=['emotion'],
                        enforce_detection=True, # Enforce that a face must be found
                        silent=True # Suppress console output
                    )
                    if result and isinstance(result, list):
                        emotions.append(result[0]['dominant_emotion'])
                except ValueError:
                    # This error is thrown by deepface if no face is found
                    continue # Skip this frame
            
            frame_count += 1
            
        cap.release()

    except Exception as e:
        print(f"An error occurred during video analysis: {e}")
        return "Could not complete body language analysis."

    # If no emotions were detected, return a default message
    if not emotions:
        return "Could not detect a face clearly during the answer."

    # Find the most common emotion detected throughout the video
    most_common_emotion = Counter(emotions).most_common(1)[0][0]

    # Generate feedback based on the most common emotion
    if most_common_emotion in ['happy', 'neutral']:
        return "You appeared confident and composed. Great job!"
    elif most_common_emotion in ['fear', 'sad']:
        return "You seemed a bit nervous. Remember to stay calm and take a deep breath."
    elif most_common_emotion == 'angry':
        return "You appeared a bit tense. Try to maintain a calm and open expression."
    else:
        # Covers disgust, surprise
        return f"Your dominant emotion was {most_common_emotion}. Aim for a neutral and engaged expression."