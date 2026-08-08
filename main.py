import sys
import os

# Add scl-ai-service directory to Python path
ai_service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "scl-ai-service"))
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

# Import FastAPI app from scl-ai-service/app/main.py
from app.main import app
