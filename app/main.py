import sys
import os
import importlib.util

# Add scl-ai-service directory to sys.path
ai_service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scl-ai-service"))
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

# Path to the actual FastAPI app script
target_main_path = os.path.join(ai_service_dir, "app", "main.py")

# Dynamically import scl-ai-service/app/main.py under a unique module name to avoid circular import
spec = importlib.util.spec_from_file_location("ai_service_app_main", target_main_path)
ai_main_module = importlib.util.module_from_spec(spec)
sys.modules["ai_service_app_main"] = ai_main_module
spec.loader.exec_module(ai_main_module)

# Expose the FastAPI app object for Uvicorn
app = ai_main_module.app
