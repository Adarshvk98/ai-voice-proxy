#!/usr/bin/env bash

# AI Voice Proxy Development Environment
echo "🚀 AI Voice Proxy Development Environment"
echo "📦 Node.js: $(node --version 2>/dev/null || echo 'Not available')"
echo "� pnpm: $(pnpm --version 2>/dev/null || echo 'Not available')"
echo "�🐍 Python: $(python --version 2>/dev/null || echo 'Not available')"
echo "🐳 Docker: $(docker --version 2>/dev/null || echo 'Not available')"
echo "🤖 Ollama: $(ollama --version 2>/dev/null || echo 'Not installed yet')"
echo "🎵 FFmpeg: $(ffmpeg -version 2>/dev/null | head -1 | cut -d' ' -f3 || echo 'Not available')"
echo ""
echo "💡 Available commands:"
echo "  devbox run install-deps  - Install dependencies with pnpm"
echo "  devbox run build         - Build TypeScript"
echo "  devbox run dev           - Start development server"
echo "  devbox run test          - Run tests"
echo "  devbox run start         - Start production server"
echo "  ./setup.sh               - Run complete setup"
echo "  ollama serve             - Start Ollama service"
echo ""
echo "📝 First time setup:"
echo "  1. devbox run install-whisper  - Install OpenAI Whisper"
echo "  2. devbox run setup-ollama     - Setup Ollama with Llama3"
echo "  3. Install BlackHole audio driver manually"
echo ""

# Set environment variables
export NODE_ENV=development
export WHISPER_MODEL=base
export OLLAMA_HOST=http://localhost:11434
export TTS_ENGINE=coqui
export AUDIO_SAMPLE_RATE=16000
export AUDIO_CHANNELS=1

# Add pipx to PATH if available
if command -v pipx &> /dev/null; then
    pipx ensurepath
fi