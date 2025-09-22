# Devbox Setup for AI Voice Proxy

This project uses [Devbox](https://www.jetpack.io/devbox) to ensure consistent development environments across all machines.

## 🚀 Quick Start

### Prerequisites
- Install Devbox: `curl -fsSL https://get.jetpack.io/devbox | bash`

### Setup Development Environment

1. **Enter the devbox shell:**
   ```bash
   devbox shell
   ```

2. **Install Node.js dependencies:**
   ```bash
   devbox run install-deps  # Uses pnpm for faster installs
   ```

3. **Install AI prerequisites:**
   ```bash
   # Install Whisper (speech recognition)
   devbox run install-whisper
   
   # Setup Ollama (AI text processing)
   devbox run setup-ollama
   ```

4. **Start development:**
   ```bash
   devbox run dev
   ```

## 📦 Included Packages

- **Node.js 20** - JavaScript runtime
- **pnpm** - Fast, disk space efficient package manager
- **Python 3.11** - For AI tools
- **Docker & Docker Compose** - Containerization
- **Ollama** - Local AI model runner
- **FFmpeg** - Audio/video processing
- **PortAudio** - Audio I/O library
- **pkg-config** - Package configuration

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `devbox run install-deps` | Install Node.js dependencies with pnpm |
| `devbox run install-whisper` | Install OpenAI Whisper |
| `devbox run setup-ollama` | Setup Ollama with Llama3 |
| `devbox run build` | Build TypeScript |
| `devbox run dev` | Start development server |
| `devbox run test` | Run tests |
| `devbox run start` | Start production server |

## 🌍 Environment Variables

The following environment variables are automatically set:

- `NODE_ENV=development`
- `WHISPER_MODEL=base`
- `OLLAMA_HOST=http://localhost:11434`
- `TTS_ENGINE=coqui`
- `AUDIO_SAMPLE_RATE=16000`
- `AUDIO_CHANNELS=1`

## 🎯 Manual Setup Required

Some components need manual installation:

1. **BlackHole Audio Driver** (macOS only):
   - Download from: https://existential.audio/blackhole/
   - Required for virtual microphone functionality

## 🔄 Workflow

1. `devbox shell` - Enter development environment
2. `devbox run install-deps` - Install dependencies
3. `devbox run install-whisper` - Setup speech recognition
4. `devbox run setup-ollama` - Setup AI text processing
5. Install BlackHole manually
6. `devbox run dev` - Start developing!

## 🧹 Clean Environment

To start fresh:
```bash
exit                    # Exit devbox shell
devbox shell            # Re-enter with clean environment
```

## 🆘 Troubleshooting

- **Package not found**: Run `devbox search <package-name>` to find available packages
- **Version conflicts**: Delete `devbox.lock` and run `devbox shell` again
- **Permission issues**: Make sure scripts are executable with `chmod +x`

## 📝 Adding New Packages

```bash
devbox add <package-name>
```

Example:
```bash
devbox add redis@7
```