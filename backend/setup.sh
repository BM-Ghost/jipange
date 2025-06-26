#!/bin/bash

# Jipange Backend Setup Script
echo "🚀 Setting up Jipange AI Backend..."

# Create virtual environment
echo "📦 Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Create .env file from example
echo "⚙️ Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your API keys."
else
    echo "⚠️ .env file already exists."
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p data

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the .env file with your API keys"
echo "2. Run: python run.py"
echo "3. Visit: http://localhost:8000/docs"
