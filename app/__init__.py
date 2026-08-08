import os
import sys

# Extend package search path so root 'app' module includes scl-ai-service/app/
scl_ai_app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scl-ai-service", "app"))
if os.path.exists(scl_ai_app_dir):
    __path__.append(scl_ai_app_dir)

scl_ai_root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scl-ai-service"))
if scl_ai_root_dir not in sys.path:
    sys.path.insert(0, scl_ai_root_dir)
