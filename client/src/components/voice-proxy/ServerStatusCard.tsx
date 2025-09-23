import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Wifi, WifiOff } from 'lucide-react'
import type { ServerStatus } from './types'

interface ServerStatusProps {
  isConnected: boolean
  serverStatus: ServerStatus | null
  error?: string | null
}

export function ServerStatusCard({ isConnected, serverStatus, error }: ServerStatusProps) {
  return (
    <>
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
    </>
  )
}