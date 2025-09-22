#!/bin/bash

# AI Voice Proxy Setup Script
# This script helps you set up all the required dependencies for the AI Voice Proxy

set -e

echo "🎙️ AI Voice Proxy Setup Script"
echo "=============================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS. Please check the README for manual installation steps."
    exit 1
fi

echo "📋 Checking system requirements..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Please install Homebrew first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing Node.js..."
    brew install node
else
    echo "✅ Node.js found: $(node --version)"
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop from:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
else
    echo "✅ Docker found: $(docker --version)"
fi

echo ""
echo "🔧 Installing system dependencies..."

# Install BlackHole (virtual audio driver)
echo "📻 Installing BlackHole virtual audio driver..."
if ! brew list blackhole-2ch &> /dev/null; then
    brew install blackhole-2ch
    echo "✅ BlackHole installed successfully"
    echo "ℹ️  You may need to restart your computer for BlackHole to work properly"
else
    echo "✅ BlackHole already installed"
fi

# Install Ollama
echo "🧠 Installing Ollama..."
if ! command -v ollama &> /dev/null; then
    brew install ollama
    echo "✅ Ollama installed successfully"
else
    echo "✅ Ollama already installed: $(ollama --version)"
fi

# Start Ollama service (required for model installation)
echo "🚀 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait a bit for Ollama to start
sleep 3

# Install Ollama model
echo "📦 Installing Llama3 model (this may take a while)..."
ollama pull llama3
echo "✅ Llama3 model installed successfully"

# Stop Ollama service
kill $OLLAMA_PID 2>/dev/null || true

echo ""
echo "🐳 Setting up Docker services..."

# Install Whisper (optional, can also use local pip install)
echo "📝 Note: For Whisper, you can either:"
echo "   1. Use Docker (recommended): docker-compose up -d"
echo "   2. Install locally: pip install openai-whisper"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy environment file: cp .env.example .env"
echo "2. Edit .env file with your preferences"
echo "3. Start Docker services: docker-compose up -d"
echo "4. Start the AI Voice Proxy: npm run dev"
echo "5. Configure your audio settings (see README.md)"
echo ""
echo "🔧 Audio Setup:"
echo "1. In macOS Sound Settings:"
echo "   - Create a Multi-Output Device (your speakers + BlackHole)"
echo "   - Set this as your output device"
echo "2. In Teams/Slack/Zoom:"
echo "   - Set 'BlackHole 2ch' as your microphone input"
echo ""
echo "📚 For detailed instructions, see README.md"
echo ""
echo "🎙️ Ready to start your AI Voice Proxy!"