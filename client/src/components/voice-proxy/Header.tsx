import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function Header() {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="text-5xl">🎤</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Voice Proxy
          </h1>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          Beta Version
        </Badge>
      </div>
      
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        Real-time AI voice enhancement for video calls with advanced speech processing
      </p>
      
      <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          ✨ AI-Powered
        </span>
        <Separator orientation="vertical" className="h-4" />
        <span className="flex items-center gap-1">
          🎯 Real-time Processing
        </span>
        <Separator orientation="vertical" className="h-4" />
        <span className="flex items-center gap-1">
          🔊 Voice Cloning
        </span>
      </div>
    </div>
  )
}