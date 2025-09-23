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
    <Card className={`border-l-4 ${
      isRealTimeActive 
        ? 'border-l-red-500 bg-gradient-to-br from-white to-red-50' 
        : 'border-l-orange-500 bg-gradient-to-br from-white to-orange-50'
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isRealTimeActive ? (
            <Mic className="h-5 w-5 text-red-500 animate-pulse" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
          Real-time Mode
          <Badge variant={isRealTimeActive ? "default" : "secondary"} 
                 className={isRealTimeActive ? "bg-red-600 text-white hover:bg-red-700" : ""}>
            {isRealTimeActive ? "LIVE" : "OFFLINE"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Live voice processing for video calls with instant AI enhancement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className={`relative inline-flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
            isRealTimeActive 
              ? 'bg-red-50 text-red-600 border-2 border-red-200' 
              : 'bg-gray-50 text-gray-600 border-2 border-gray-200'
          }`}>
            {isRealTimeActive ? (
              <>
                <Mic className="h-10 w-10" />
                <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"></div>
              </>
            ) : (
              <MicOff className="h-10 w-10" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className={`font-semibold text-lg ${
              isRealTimeActive 
                ? 'text-red-700' 
                : 'text-gray-800'
            }`}>
              {isRealTimeActive ? 'Processing Active' : 'Ready to Start'}
            </h3>
            <p className={`text-sm ${
              isRealTimeActive 
                ? 'text-red-600' 
                : 'text-gray-600'
            }`}>
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
          variant="default"
          className={`w-full relative overflow-hidden transition-all duration-300 ${
            isRealTimeActive 
              ? 'bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md' 
              : 'bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md'
          }`}
          size="lg"
        >
          {/* Simple shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
          
          <div className="relative z-10 flex items-center justify-center">
            {isRealTimeActive ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                <span>Stop Real-time Processing</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                <span>Start Real-time Processing</span>
              </>
            )}
          </div>
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