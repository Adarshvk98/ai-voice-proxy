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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header />
        
        <ServerStatusCard 
          isConnected={isConnected}
          serverStatus={serverStatus}
          error={error}
        />

        <div className="grid md:grid-cols-2 gap-6">
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
    </div>
  )
}