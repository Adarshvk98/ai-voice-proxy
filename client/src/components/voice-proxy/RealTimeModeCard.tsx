import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mic, MicOff, Square, Zap, Info } from 'lucide-react'

interface RealTimeModeProps {
  isRealTimeActive: boolean
  isConnected: boolean
  onToggleRealTime: () => void
}

export function RealTimeModeCard({
  isRealTimeActive,
  isConnected,
  onToggleRealTime
}: RealTimeModeProps) {
  return (
    <Card className={`border-l-4 ${isRealTimeActive ? 'border-l-red-500' : 'border-l-orange-500'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isRealTimeActive ? (
            <Mic className="h-5 w-5 text-red-500 animate-pulse" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
          Real-time Mode
          <Badge variant={isRealTimeActive ? "destructive" : "secondary"}>
            {isRealTimeActive ? "LIVE" : "OFFLINE"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Live voice processing for video calls with instant AI enhancement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className={`relative inline-flex items-center justify-center w-20 h-20 rounded-full ${
            isRealTimeActive ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
          } transition-all duration-300`}>
            {isRealTimeActive ? (
              <>
                <Mic className="h-10 w-10" />
                <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"></div>
                <div className="absolute inset-2 rounded-full bg-red-500 opacity-30 animate-pulse"></div>
              </>
            ) : (
              <MicOff className="h-10 w-10" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">
              {isRealTimeActive ? 'Processing Active' : 'Ready to Start'}
            </h3>
            <p className="text-sm text-gray-600">
              {isRealTimeActive 
                ? 'Your voice is being enhanced in real-time. Speak naturally!'
                : 'Click below to start real-time voice processing'
              }
            </p>
          </div>
        </div>

        {!isConnected && (
          <Alert variant="warning">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Connection required for real-time processing. Please check your connection.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={onToggleRealTime}
          disabled={!isConnected}
          variant={isRealTimeActive ? "destructive" : "default"}
          className={`w-full transition-all duration-300 ${
            isRealTimeActive 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
          }`}
          size="lg"
        >
          {isRealTimeActive ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Stop Real-time Processing
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Start Real-time Processing
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Low latency processing</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Automatic voice enhancement</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}