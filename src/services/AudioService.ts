import { execSync } from 'child_process';
import { EventEmitter } from 'events';

export interface AudioConfig {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  inputDevice?: string;
  outputDevice?: string;
}

export class AudioService extends EventEmitter {
  private config: AudioConfig;
  private isRecording: boolean = false;
  private micProcess: any = null;

  constructor(config: AudioConfig) {
    super();
    this.config = {
      sampleRate: config.sampleRate || 16000,
      channels: config.channels || 1,
      bitDepth: config.bitDepth || 16,
      inputDevice: config.inputDevice,
      outputDevice: config.outputDevice,
    };
  }

  /**
   * Start recording audio from microphone
   */
  startRecording(): void {
    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    try {
      // Use sox to record audio
      const command = `sox -t coreaudio "${this.config.inputDevice || 'default'}" -r ${this.config.sampleRate} -c ${this.config.channels} -b ${this.config.bitDepth} -t wav -`;
      
      this.micProcess = require('child_process').spawn('sox', command.split(' '), {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.isRecording = true;
      console.log('Started recording audio');

      this.micProcess.stdout.on('data', (data: Buffer) => {
        this.emit('audioData', data);
      });

      this.micProcess.on('error', (error: Error) => {
        console.error('Recording error:', error);
        this.emit('error', error);
        this.isRecording = false;
      });

      this.micProcess.on('close', () => {
        console.log('Recording stopped');
        this.isRecording = false;
        this.emit('recordingStopped');
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.emit('error', error);
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording(): void {
    if (!this.isRecording || !this.micProcess) {
      return;
    }

    try {
      this.micProcess.kill('SIGTERM');
      this.isRecording = false;
      this.micProcess = null;
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }

  /**
   * Play audio to the output device (BlackHole for virtual mic)
   */
  playAudio(audioBuffer: Buffer, outputDevice?: string): void {
    try {
      const device = outputDevice || this.config.outputDevice || 'BlackHole 2ch';
      
      // Write audio buffer to temporary file
      const tempFile = `/tmp/audio_${Date.now()}.wav`;
      require('fs').writeFileSync(tempFile, audioBuffer);
      
      // Play to specified device
      const command = `ffplay -nodisp -autoexit -f wav -i "${tempFile}"`;
      execSync(command, { stdio: 'ignore' });
      
      // Clean up
      setTimeout(() => {
        try {
          require('fs').unlinkSync(tempFile);
        } catch {
          // Ignore cleanup errors
        }
      }, 1000);

    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }

  /**
   * Stream audio to virtual microphone device
   */
  streamToVirtualMic(audioBuffer: Buffer): void {
    try {
      // Stream audio to BlackHole (virtual mic)
      const tempFile = `/tmp/stream_${Date.now()}.wav`;
      require('fs').writeFileSync(tempFile, audioBuffer);
      
      // Use sox to play to BlackHole device
      const command = `sox "${tempFile}" -t coreaudio "BlackHole 2ch"`;
      execSync(command, { stdio: 'ignore' });
      
      // Clean up
      setTimeout(() => {
        try {
          require('fs').unlinkSync(tempFile);
        } catch {
          // Ignore cleanup errors
        }
      }, 500);

    } catch (error) {
      console.error('Virtual mic streaming error:', error);
    }
  }

  /**
   * List available audio devices
   */
  listAudioDevices(): { input: string[]; output: string[] } {
    try {
      // List input devices
      const inputDevices = execSync('sox -V1 -n -t coreaudio dummy trim 0 0 2>&1 | grep "Available" -A 20 | grep "Input"', { encoding: 'utf8' });
      
      // List output devices  
      const outputDevices = execSync('sox -V1 -n -t coreaudio dummy trim 0 0 2>&1 | grep "Available" -A 20 | grep "Output"', { encoding: 'utf8' });
      
      return {
        input: inputDevices.split('\n').filter(line => line.trim()),
        output: outputDevices.split('\n').filter(line => line.trim())
      };
    } catch (error) {
      console.error('Error listing audio devices:', error);
      return { input: [], output: [] };
    }
  }

  /**
   * Check if BlackHole is installed
   */
  isBlackHoleInstalled(): boolean {
    try {
      const devices = this.listAudioDevices();
      return devices.output.some(device => device.includes('BlackHole'));
    } catch {
      return false;
    }
  }

  /**
   * Get recording status
   */
  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  /**
   * Create a WAV header for raw audio data
   */
  private createWavHeader(dataLength: number): Buffer {
    const header = Buffer.alloc(44);
    
    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataLength, 4);
    header.write('WAVE', 8);
    
    // Format chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Chunk size
    header.writeUInt16LE(1, 20);  // Audio format (PCM)
    header.writeUInt16LE(this.config.channels!, 22);
    header.writeUInt32LE(this.config.sampleRate!, 24);
    header.writeUInt32LE(this.config.sampleRate! * this.config.channels! * (this.config.bitDepth! / 8), 28);
    header.writeUInt16LE(this.config.channels! * (this.config.bitDepth! / 8), 32);
    header.writeUInt16LE(this.config.bitDepth!, 34);
    
    // Data chunk
    header.write('data', 36);
    header.writeUInt32LE(dataLength, 40);
    
    return header;
  }

  /**
   * Convert raw audio data to WAV format
   */
  toWav(rawAudio: Buffer): Buffer {
    const header = this.createWavHeader(rawAudio.length);
    return Buffer.concat([header, rawAudio]);
  }
}