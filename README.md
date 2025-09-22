# AI Voice Proxy

A real-time AI voice proxy system that acts as an intelligent intermediary for video calls. When you speak in Microsoft Teams, Slack, Zoom, or any other video conferencing application, this system will:

1. **Listen** to your voice in real-time
2. **Transcribe** your speech using local Whisper
3. **Improve** your text using local Ollama AI
4. **Synthesize** the improved speech in your cloned voice
5. **Output** to a virtual microphone that other participants hear

**Everything runs locally** - no cloud services, completely free!

## 🎯 Use Case

Perfect for:
- **Non-native English speakers** who want their speech improved in real-time
- **Professionals** who want to sound more polished in meetings
- **Anyone** who wants AI assistance with their communication
- **Privacy-conscious users** who need everything to run locally

## ✨ Features

- **🎙️ Real-time Voice Processing**: Continuous speech improvement during calls
- **🔄 Voice Cloning**: Clone your voice from a 30-60 second sample
- **🧠 AI Text Improvement**: Uses Ollama (Llama3) to enhance clarity and professionalism
- **🎯 Virtual Microphone**: Outputs to BlackHole for seamless integration
- **🏠 100% Local**: No cloud dependencies, completely private
- **⚡ Low Latency**: Optimized for real-time communication
- **🔧 Configurable**: Adjust models, quality, and processing parameters

## 🏗️ Architecture

```
Your Microphone ──▶ Whisper ──▶ Ollama ──▶ Coqui TTS ──▶ BlackHole ──▶ Teams/Slack/Zoom
    (Raw Audio)    (Speech    (Text      (Synthesized    (Virtual      (Other 
                   to Text)   Improve)    Your Voice)     Microphone)   Participants)
```

## 🚀 Quick Start

### 🎁 Option 1: Devbox (Recommended - Works Everywhere!)

**Use Devbox for consistent, reproducible environments:**

```bash
# 1. Install Devbox (one-time setup)
curl -fsSL https://get.jetpack.io/devbox | bash

# 2. Clone and enter the project
git clone https://github.com/Adarshvk98/ai-voice-proxy.git
cd ai-voice-proxy

# 3. Enter devbox shell (installs everything automatically)
devbox shell

# 4. Install Node.js dependencies with pnpm
devbox run install-deps

# 5. Install AI prerequisites
devbox run install-whisper    # Speech recognition
devbox run setup-ollama       # AI text processing

# 6. Install BlackHole manually (one-time)
# Download from: https://existential.audio/blackhole/

# 7. Start developing!
devbox run dev
```

**That's it!** Everything else is managed by Devbox. Perfect for teams and consistent environments.

See [DEVBOX.md](DEVBOX.md) for complete Devbox documentation.

### 🛠️ Option 2: Manual Installation

### Prerequisites

- **macOS** (tested on M3, should work on Intel Macs)
- **Node.js 16+**
- **Docker** (for TTS and Whisper services)
- **Ollama** (for AI text improvement)
- **BlackHole** (virtual audio driver)

### 🎮 Test Interface

A web-based test client is included at `client/test-client.html`. Open it in your browser after starting the server to:
- Control real-time mode
- Test text processing
- Clone voices
- Monitor system status

### 1. Install System Dependencies

#### Automated Setup (Recommended)
```bash
# Run the automated setup script
./setup.sh
```

This script will automatically install:
- BlackHole virtual audio driver
- Ollama and Llama3 model
- Check system requirements

#### Manual Installation

#### Install BlackHole (Virtual Audio Driver)
```bash
brew install blackhole-2ch
```

#### Install Ollama
```bash
# Download from https://ollama.ai or use:
curl https://ollama.ai/install.sh | sh

# Install the Llama3 model
ollama pull llama3
```

### 2. Clone and Setup Project

```bash
git clone <repository-url>
cd ai-voice-proxy

# Install Node.js dependencies (uses pnpm for better performance)
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your preferences
```

### 3. Start Supporting Services

```bash
# Start TTS and Whisper services with Docker
docker-compose up -d

# Wait for services to be ready
docker-compose logs -f
```

### 4. Build and Run

```bash
# Build the TypeScript project
pnpm run build

# Start the AI Voice Proxy
pnpm start

# For development with hot reload:
pnpm run dev
```

### 5. Configure Audio

1. **In macOS Sound Settings:**
   - Create a **Multi-Output Device** (your speakers + BlackHole)
   - Set this as your **output device** (so you can hear yourself)

2. **In Teams/Slack/Zoom:**
   - Set **BlackHole 2ch** as your **microphone input**
   - Your improved AI voice will be transmitted to other participants

## 🎙️ Voice Cloning Setup

### Record Your Voice Sample

Create a clear 30-60 second recording of yourself speaking:

```bash
# Record a sample (speak clearly for 30-60 seconds)
# Save as: ./voice_sample.wav
```

### Clone Your Voice

```bash
# Using the API
curl -X POST http://localhost:3000/voice/clone \
  -H "Content-Type: application/json" \
  -d '{
    "samplePath": "./voice_sample.wav",
    "voiceName": "my_voice"
  }'
```

Or use the WebSocket interface for real-time cloning.

## 🔄 Usage Modes

### Real-time Mode (For Live Calls)

```bash
# Start real-time processing
curl -X POST http://localhost:3000/realtime/start

# Your speech is now being processed in real-time
# Speak normally, and your improved voice goes to BlackHole

# Stop when done
curl -X POST http://localhost:3000/realtime/stop
```

### Text Processing Mode (For Testing)

```bash
# Process text directly
curl -X POST http://localhost:3000/process-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Uh, I think, um, maybe we should, you know, consider this approach?",
    "outputToVirtualMic": true
  }'

# Returns improved text and plays to virtual mic
```

## 📡 API Endpoints

### HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Server information and setup instructions |
| `/health` | GET | Health check and status |
| `/status` | GET | AI Voice Proxy state and audio devices |
| `/devices` | GET | Available audio input/output devices |
| `/process-text` | POST | Process text input (non-real-time) |
| `/realtime/start` | POST | Start real-time voice processing |
| `/realtime/stop` | POST | Stop real-time voice processing |
| `/voice/clone` | POST | Clone voice from audio sample |

### WebSocket Endpoint

Connect to `ws://localhost:3000` for real-time control:

```javascript
const ws = new WebSocket('ws://localhost:3000');

// Start real-time mode
ws.send(JSON.stringify({ type: 'startRealTime' }));

// Process text
ws.send(JSON.stringify({ 
  type: 'processText', 
  text: 'Hello world' 
}));

// Clone voice
ws.send(JSON.stringify({ 
  type: 'cloneVoice', 
  samplePath: './sample.wav',
  voiceName: 'my_voice'
}));
```

## ⚙️ Configuration

Edit `.env` file:

```env
# Whisper (Speech Recognition)
WHISPER_MODEL=base.en          # Model size: tiny, base, small, medium, large
WHISPER_LANGUAGE=en            # Language code

# Ollama (AI Improvement)
OLLAMA_MODEL=llama3            # Available models: llama3, mistral, etc.

# Audio Settings
AUDIO_SAMPLE_RATE=16000        # Sample rate (Hz)
AUDIO_OUTPUT_DEVICE=BlackHole 2ch  # Virtual microphone device

# Real-time Settings
REALTIME_CHUNK_DURATION=3      # Seconds per processing chunk
```

## 🛠️ Development

### Available Scripts

- `npm run build` - Build TypeScript project
- `npm start` - Start production server
- `npm run dev` - Development with hot reload
- `npm test` - Run tests
- `npm run lint` - Check code style

### Project Structure

```
ai-voice-proxy/
├── setup.sh                          # Automated setup script
├── docker-compose.yml                # TTS & Whisper services
├── client/
│   └── test-client.html              # Web-based test interface
├── src/
│   ├── index.ts                      # Main server entry
│   ├── services/
│   │   ├── AIVoiceProxyOrchestrator.ts   # Main orchestration logic
│   │   ├── WhisperService.ts             # Speech recognition
│   │   ├── OllamaService.ts              # AI text improvement
│   │   ├── TTSService.ts                 # Text-to-speech
│   │   └── AudioService.ts               # Audio I/O handling
│   ├── routes/
│   │   └── index.ts                      # HTTP API routes
│   └── middleware/
│       └── errorHandler.ts              # Error handling
├── .env.example                       # Environment configuration template
└── README.md                          # This file
```

## 🔧 Troubleshooting

### BlackHole Not Working
```bash
# Reinstall BlackHole
brew uninstall blackhole-2ch
brew install blackhole-2ch

# Check if device is available
system_profiler SPAudioDataType | grep BlackHole
```

### Ollama Model Issues
```bash
# Check available models
ollama list

# Reinstall model
ollama rm llama3
ollama pull llama3
```

### Audio Quality Issues
- Ensure good microphone quality
- Reduce background noise
- Adjust `REALTIME_CHUNK_DURATION` for better/faster processing
- Use higher quality Whisper model (`small`, `medium`, `large`)

### Latency Issues
- Use `tiny` or `base` Whisper model for faster processing
- Reduce `REALTIME_CHUNK_DURATION`
- Ensure Docker services have adequate resources

## 🎬 Demo Video Setup

1. Start the AI Voice Proxy: `npm start`
2. Clone your voice: Use `/voice/clone` endpoint
3. Start real-time mode: `POST /realtime/start`
4. Configure Teams/Slack to use BlackHole as microphone
5. Join a test call and speak normally
6. Other participants hear your AI-improved voice!

## 🎮 Using the Test Client

1. **Start the server**: `npm run dev`
2. **Open test interface**: Open `client/test-client.html` in your browser
3. **Connect**: Click "Connect to Server"
4. **Test text processing**: Enter text and click "Process Text"
5. **Clone your voice**: Enter audio file path and voice name
6. **Start real-time mode**: Click "Start Real-time" for live processing
7. **Monitor activity**: Watch the activity log for real-time feedback

The test client provides a user-friendly interface for all AI Voice Proxy features without needing to use curl commands or write code.

## ⚡ Quick Command Reference

```bash
# Setup (run once)
./setup.sh                           # Automated system setup
cp .env.example .env                  # Copy environment config
docker-compose up -d                  # Start TTS & Whisper services

# Development
npm run dev                           # Start with hot reload
npm run build                        # Build TypeScript
npm start                            # Start production server

# Usage
open client/test-client.html          # Open test interface
curl localhost:3000/health            # Check server status
curl -X POST localhost:3000/realtime/start  # Start real-time mode
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ **Free to use** for personal and commercial projects
- ✅ **Free to modify** and distribute
- ✅ **No warranty** - use at your own risk
- ✅ **Attribution required** - keep the copyright notice

## ⚖️ Ethics & Consent

**Important**: Always obtain explicit consent before using voice cloning technology. This tool should only be used with your own voice or with explicit permission from others. Be transparent about AI assistance in professional settings when appropriate.

## 🆘 Support

- 📖 Check the [troubleshooting section](#-troubleshooting)
- 🐛 Open an issue for bugs
- 💡 Request features via issues
- 📧 Contact for support