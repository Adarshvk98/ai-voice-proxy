import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import chalk from 'chalk';

export interface VoiceMessage {
  type: 'audio' | 'text' | 'control';
  data: Buffer | string;
  timestamp: number;
  clientId: string;
}

export interface AIResponse {
  type: 'audio' | 'text';
  data: Buffer | string;
  timestamp: number;
}

export class VoiceProxyServer extends EventEmitter {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket>;
  private aiServiceUrl: string;
  private apiKey: string;

  constructor(wss: WebSocketServer) {
    super();
    this.wss = wss;
    this.clients = new Map();
    this.aiServiceUrl = process.env.AI_SERVICE_URL || '';
    this.apiKey = process.env.AI_API_KEY || '';
    
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);
      
      console.log(chalk.green('🔗 VoiceProxy: Client ') + chalk.yellow(clientId) + chalk.green(' connected'));
      
      ws.on('message', async (data: Buffer) => {
        try {
          await this.handleMessage(clientId, data);
        } catch (error) {
          console.error(chalk.red(`❌ VoiceProxy: Error handling message from ${clientId}:`), error);
          this.sendError(clientId, 'Failed to process message');
        }
      });
      
      ws.on('close', () => {
        console.log(chalk.yellow('🔌 VoiceProxy: Client ') + chalk.yellow(clientId) + chalk.yellow(' disconnected'));
        this.clients.delete(clientId);
      });
      
      ws.on('error', (error) => {
        console.error(chalk.red(`❌ VoiceProxy: WebSocket error for client ${clientId}:`), error);
        this.clients.delete(clientId);
      });
      
      // Send welcome message
      this.sendMessage(clientId, {
        type: 'control',
        data: JSON.stringify({ status: 'connected', clientId }),
        timestamp: Date.now()
      });
    });
  }

  private async handleMessage(clientId: string, data: Buffer): Promise<void> {
    try {
      // Parse message - could be JSON for control messages or raw audio data
      let message: VoiceMessage;
      
      try {
        const parsed = JSON.parse(data.toString());
        message = {
          type: parsed.type,
          data: parsed.data,
          timestamp: Date.now(),
          clientId
        };
      } catch {
        // Treat as raw audio data
        message = {
          type: 'audio',
          data: data,
          timestamp: Date.now(),
          clientId
        };
      }
      
      // Process based on message type
      switch (message.type) {
        case 'audio':
          await this.processAudioMessage(message);
          break;
        case 'text':
          await this.processTextMessage(message);
          break;
        case 'control':
          await this.processControlMessage(message);
          break;
        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(chalk.red('❌ VoiceProxy: Error in handleMessage:'), error);
      throw error;
    }
  }

  private async processAudioMessage(message: VoiceMessage): Promise<void> {
    // Implement audio processing and AI service integration
    console.log(`Processing audio message from client ${message.clientId}`);
    
    // Placeholder for AI service call
    const aiResponse = await this.callAIService(message.data);
    
    // Send response back to client
    this.sendMessage(message.clientId, {
      type: 'audio',
      data: aiResponse.data,
      timestamp: Date.now()
    });
  }

  private async processTextMessage(message: VoiceMessage): Promise<void> {
    console.log(`Processing text message from client ${message.clientId}`);
    
    // Placeholder for text processing
    const response = `Echo: ${message.data}`;
    
    this.sendMessage(message.clientId, {
      type: 'text',
      data: response,
      timestamp: Date.now()
    });
  }

  private async processControlMessage(message: VoiceMessage): Promise<void> {
    console.log(`Processing control message from client ${message.clientId}`);
    
    try {
      const controlData = JSON.parse(message.data as string);
      
      switch (controlData.command) {
        case 'ping':
          this.sendMessage(message.clientId, {
            type: 'control',
            data: JSON.stringify({ command: 'pong', timestamp: Date.now() }),
            timestamp: Date.now()
          });
          break;
        default:
          console.log(`Unknown control command: ${controlData.command}`);
      }
    } catch (error) {
      console.error('Error processing control message:', error);
    }
  }

  private async callAIService(audioData: Buffer | string): Promise<AIResponse> {
    // Placeholder for actual AI service integration
    // In a real implementation, this would call OpenAI, Google Cloud Speech, etc.
    
    return {
      type: 'text',
      data: 'AI response placeholder',
      timestamp: Date.now()
    };
  }

  private sendMessage(clientId: string, message: Partial<VoiceMessage>): void {
    const client = this.clients.get(clientId);
    if (!client || client.readyState !== WebSocket.OPEN) {
      console.warn(`Cannot send message to client ${clientId}: connection not open`);
      return;
    }
    
    try {
      const messageToSend = JSON.stringify(message);
      client.send(messageToSend);
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
    }
  }

  private sendError(clientId: string, error: string): void {
    this.sendMessage(clientId, {
      type: 'control',
      data: JSON.stringify({ error, timestamp: Date.now() }),
      timestamp: Date.now()
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }

  public getClientCount(): number {
    return this.clients.size;
  }
}