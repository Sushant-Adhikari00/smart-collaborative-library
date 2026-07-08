import logging

logger = logging.getLogger(__name__)

# Lazy-initialized global Whisper model (shared concept with video.py)
_model = None


def _get_model():
    """Lazy-initialize Whisper model."""
    global _model
    if _model is None:
        try:
            import whisper
        except ImportError:
            raise ImportError(
                "openai-whisper is required for audio processing. "
                "Install it with: pip install openai-whisper"
            )
        logger.info(
            "Loading Whisper 'base' model (first-time download may take a while)..."
        )
        _model = whisper.load_model("base")
        logger.info("Whisper model loaded successfully")
    return _model


def process_audio(file_path: str) -> dict:
    """Transcribe speech from an audio file using OpenAI Whisper."""
    try:
        model = _get_model()
        logger.info(f"Transcribing audio: {file_path}")

        result = model.transcribe(file_path)
        text = result.get("text", "").strip()

        if not text:
            raise ValueError("No speech could be transcribed from the audio")

        logger.info(f"Transcribed {len(text)} characters from audio: {file_path}")
        return {"text": text, "type": "audio"}

    except Exception as e:
        logger.error(f"Failed to process audio {file_path}: {e}")
        raise
