import { useState, useEffect } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import {
  Header,
  ServerStatusCard,
  TextProcessingCard,
  RealTimeModeCard,
  VoiceCloningCard,
  InstructionsCard,
  type ServerStatus,
  type WebSocketMessage,
  API_BASE_URL,
  WS_URL
} from './voice-proxy'

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
        if (response.ok) {
          const status = await response.json()
          setServerStatus(status)
        }
      } catch (error) {
        console.error('Failed to fetch server status:', error)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const message = lastMessage as WebSocketMessage
      
      switch (message.type) {
        case 'textProcessed':
          setProcessedText(message.result.improvedText)
          setIsProcessing(false)
          break
        case 'realTimeStarted':
          setIsRealTimeActive(true)
          break
        case 'realTimeStopped':
          setIsRealTimeActive(false)
          break
        case 'error':
          console.error('WebSocket error:', message.message)
          setIsProcessing(false)
          alert(`Error: ${message.message}`)
          break
      }
    }
  }, [lastMessage])

  const handleProcessText = async () => {
    if (!testText.trim()) return
    
    setIsProcessing(true)
    setProcessedText('')
    
    try {
      // Try WebSocket first
      if (isConnected) {
        sendMessage({
          type: 'processText',
          text: testText
        })
      } else {
        // Fallback to HTTP
        const response = await fetch(`${API_BASE_URL}/api/text/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: testText })
        })
        
        if (response.ok) {
          const result = await response.json()
          setProcessedText(result.improvedText)
        } else {
          const error = await response.text()
          alert(`Error: ${error}`)
        }
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Error processing text:', error)
      alert('Error processing text')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTJlOGYwIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      
      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Header />
          
          <div className="space-y-6">
            <ServerStatusCard 
              isConnected={isConnected}
              serverStatus={serverStatus}
              error={error}
            />

            <div className="grid lg:grid-cols-2 gap-6">
              <TextProcessingCard
                testText={testText}
                setTestText={setTestText}
                isProcessing={isProcessing}
                processedText={processedText}
                onProcessText={handleProcessText}
              />

              <RealTimeModeCard
                isRealTimeActive={isRealTimeActive}
                isConnected={isConnected}
                onToggleRealTime={handleToggleRealTime}
              />
            </div>

            <VoiceCloningCard
              voiceName={voiceName}
              setVoiceName={setVoiceName}
              isConnected={isConnected}
              onCloneVoice={handleCloneVoice}
            />

            <InstructionsCard />
          </div>

          {/* Footer */}
          <div className="text-center py-8 border-t border-gray-200 bg-white/50 backdrop-blur-sm rounded-lg">
            <p className="text-sm text-gray-500">
              Made with ❤️ by Adarsh VK • AI Voice Proxy: Real-time voice & text magic ✨🔊 • Open source on <a href="https://github.com/adarshvk/ai-voice-proxy" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600">GitHub</a> 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}