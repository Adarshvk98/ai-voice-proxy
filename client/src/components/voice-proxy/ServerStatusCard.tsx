import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Wifi, WifiOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import type { ServerStatus } from './types'

interface ServerStatusProps {
  isConnected: boolean
  serverStatus: ServerStatus | null
  error?: string | null
}

export function ServerStatusCard({ isConnected, serverStatus, error }: ServerStatusProps) {
  const getServiceBadge = (available: boolean, name: string) => (
    <div className="flex items-center gap-2">
      {available ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className="text-sm font-medium">{name}</span>
      <Badge variant={available ? "success" : "default"} 
             className={available ? "text-xs" : "text-xs bg-red-600 text-white hover:bg-red-700"}>
        {available ? "Online" : "Offline"}
      </Badge>
    </div>
  )

  return (
    <>
      {/* Connection Status */}
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Connection Status
            <Badge variant={isConnected ? "success" : "default"} 
                   className={isConnected ? "" : "bg-red-600 text-white hover:bg-red-700"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
          <CardDescription>
            WebSocket connection to AI Voice Proxy server
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Connection Error: {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Real-time connection active' : 'Connection unavailable'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Server Status */}
      {serverStatus && (
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Service Status
              <Badge variant="secondary" className="text-xs">
                {Object.values(serverStatus).filter(Boolean).length}/4 Services
              </Badge>
            </CardTitle>
            <CardDescription>
              AI Voice Proxy service availability and health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getServiceBadge(serverStatus.whisperAvailable, "Whisper AI")}
              {getServiceBadge(serverStatus.ollamaAvailable, "Ollama LLM")}
              {getServiceBadge(serverStatus.ttsAvailable, "Text-to-Speech")}
              {getServiceBadge(serverStatus.blackHoleInstalled, "BlackHole Audio")}
            </div>
            
            {!Object.values(serverStatus).every(Boolean) && (
              <Alert variant="warning" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Some services are offline. Full functionality may be limited.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}