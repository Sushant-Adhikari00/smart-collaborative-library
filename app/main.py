import os
import sys
import importlib.util

# Target path to real scl-ai-service main.py
target_main_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scl-ai-service", "app", "main.py"))

spec = importlib.util.spec_from_file_location("scl_ai_real_main", target_main_path)
real_main = importlib.util.module_from_spec(spec)
sys.modules["scl_ai_real_main"] = real_main
spec.loader.exec_module(real_main)

# Export the FastAPI app object for Uvicorn
app = real_main.app
