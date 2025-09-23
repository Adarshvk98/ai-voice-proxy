import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Square } from 'lucide-react'

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
          onClick={onToggleRealTime}
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
  )
}