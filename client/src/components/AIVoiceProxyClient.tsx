import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Mic, MicOff, Play, Square, Volume2, Settings, Wifi, WifiOff } from 'lucide-react'

const API_BASE_URL = 'http://localhost:3000'
const WS_URL = 'ws://localhost:3000'

interface ServerStatus {
  whisperAvailable: boolean
  ollamaAvailable: boolean
  ttsAvailable: boolean
  blackHoleInstalled: boolean
  realtimeActive: boolean
}

export function AIVoiceProxyClient() {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [testText, setTestText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedText, setProcessedText] = useState('')
  const [voiceName, setVoiceName] = useState('')
  const [isRealTimeActive, setIsRealTimeActive] = useState(false)
  
  const { isConnected, sendMessage, lastMessage, error } = useWebSocket(WS_URL)

  // Fetch server status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/status`)
        const status = await response.json()
        setServerStatus(status)
      } catch (err) {
        console.error('Failed to fetch server status:', err)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Handle WebSocket errors
  useEffect(() => {
    if (error) {
      console.error('WebSocket error:', error)
    }
  }, [error])

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'textProcessed':
          setProcessedText((lastMessage as any).result?.improvedText || '')
          setIsProcessing(false)
          break
        case 'realTimeStarted':
          setIsRealTimeActive(true)
          break
        case 'realTimeStopped':
          setIsRealTimeActive(false)
          break
        case 'chunkProcessed':
          console.log('Chunk processed:', (lastMessage as any).data)
          break
        case 'error':
          console.error('WebSocket error:', (lastMessage as any).message)
          setIsProcessing(false)
          break
      }
    }
  }, [lastMessage])

  const handleProcessText = async () => {
    if (!testText.trim()) return
    
    setIsProcessing(true)
    setProcessedText('')
    
    try {
      // Try WebSocket first, fallback to HTTP
      if (isConnected) {
        sendMessage({
          type: 'processText',
          text: testText
        })
      } else {
        const response = await fetch(`${API_BASE_URL}/process-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: testText })
        })
        const result = await response.json()
        setProcessedText(result.improvedText || '')
        setIsProcessing(false)
      }
    } catch (err) {
      console.error('Failed to process text:', err)
      setIsProcessing(false)
    }
  }

  const handleToggleRealTime = () => {
    if (isRealTimeActive) {
      sendMessage({ type: 'stopRealTime' })
    } else {
      sendMessage({ type: 'startRealTime' })
    }
  }

  const handleCloneVoice = () => {
    if (!voiceName.trim()) return
    
    sendMessage({
      type: 'cloneVoice',
      voiceName: voiceName
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎤 AI Voice Proxy
          </h1>
          <p className="text-xl text-gray-600">
            Real-time AI voice enhancement for video calls
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              Connection Status
            </CardTitle>
            <CardDescription>
              WebSocket connection to AI Voice Proxy server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={isConnected ? 'text-green-700' : 'text-red-700'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              {error && <span className="text-red-500 ml-2">({error})</span>}
            </div>
          </CardContent>
        </Card>

        {/* Server Status */}
        {serverStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Service Status
              </CardTitle>
              <CardDescription>
                AI Voice Proxy service availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${serverStatus.whisperAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">Whisper</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${serverStatus.ollamaAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">Ollama</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${serverStatus.ttsAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">TTS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${serverStatus.blackHoleInstalled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">BlackHole</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Text Processing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Text Processing
              </CardTitle>
              <CardDescription>
                Test AI text improvement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Input Text
                </label>
                <Input
                  placeholder="Enter text to improve..."
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleProcessText()}
                />
              </div>
              
              <Button 
                onClick={handleProcessText}
                disabled={!testText.trim() || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Process Text
                  </>
                )}
              </Button>

              {processedText && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Improved Text
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {processedText}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real-time Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isRealTimeActive ? (
                  <Mic className="h-5 w-5 text-red-500" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
                Real-time Mode
              </CardTitle>
              <CardDescription>
                Live voice processing for video calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  isRealTimeActive ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isRealTimeActive ? (
                    <Mic className="h-8 w-8" />
                  ) : (
                    <MicOff className="h-8 w-8" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {isRealTimeActive 
                    ? 'Real-time processing is active. Your voice is being improved.'
                    : 'Click to start real-time voice processing'
                  }
                </p>
              </div>

              <Button
                onClick={handleToggleRealTime}
                disabled={!isConnected}
                variant={isRealTimeActive ? "destructive" : "default"}
                className="w-full"
              >
                {isRealTimeActive ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop Real-time
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Real-time
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Voice Cloning */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Cloning</CardTitle>
            <CardDescription>
              Clone your voice for personalized TTS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter voice name..."
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleCloneVoice}
                disabled={!voiceName.trim() || !isConnected}
              >
                Clone Voice
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Voice cloning requires a sample audio file. Use the API to upload your voice sample.
            </p>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Ensure all services are running (green status indicators above)</li>
              <li>Test text processing to verify AI improvement works</li>
              <li>Configure your video call software to use BlackHole as microphone input</li>
              <li>Start real-time mode before joining your video call</li>
              <li>Speak normally - your improved voice will be transmitted to other participants</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}