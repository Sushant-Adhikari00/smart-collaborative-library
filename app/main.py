import sys
import os

# Get absolute path to scl-ai-service
ai_service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scl-ai-service"))

# Force scl-ai-service to be at the very top of sys.path
if ai_service_dir in sys.path:
    sys.path.remove(ai_service_dir)
sys.path.insert(0, ai_service_dir)

# Unregister root 'app' module from sys.modules so 'app' resolves to scl-ai-service/app
if 'app' in sys.modules:
    del sys.modules['app']

# Import the actual FastAPI main module from scl-ai-service/app/main.py
import app.main as real_app_main

# Expose the FastAPI app object for Uvicorn
app = real_app_main.app
