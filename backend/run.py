#!/usr/bin/env python3
"""
Jipange Backend Runner
Run this script to start the FastAPI backend server
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set environment variables for development
os.environ.setdefault('PYTHONPATH', str(backend_dir))

if __name__ == "__main__":
    import uvicorn
    from main import app
    
    print("🚀 Starting Jipange AI Backend...")
    print("📡 Server will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔧 Health Check: http://localhost:8000/health")
    print("\n" + "="*50)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
