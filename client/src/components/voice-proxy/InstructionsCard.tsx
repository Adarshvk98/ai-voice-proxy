import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Settings, Mic, Play, MessageSquare } from 'lucide-react'

export function InstructionsCard() {
  const steps = [
    {
      icon: <Settings className="h-5 w-5 text-blue-500" />,
      title: "Verify Services",
      description: "Ensure all services are running (green status indicators above)",
      badge: "Setup"
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-green-500" />,
      title: "Test AI Processing",
      description: "Test text processing to verify AI improvement works",
      badge: "Testing"
    },
    {
      icon: <Mic className="h-5 w-5 text-purple-500" />,
      title: "Configure Audio",
      description: "Configure your video call software to use BlackHole as microphone input",
      badge: "Audio"
    },
    {
      icon: <Play className="h-5 w-5 text-red-500" />,
      title: "Start Real-time",
      description: "Start real-time mode before joining your video call",
      badge: "Activation"
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
      title: "Speak Naturally",
      description: "Speak normally - your improved voice will be transmitted to other participants",
      badge: "Usage"
    }
  ]

  return (
    <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-br from-white to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📚 How to Use AI Voice Proxy
          <Badge variant="info" className="text-xs">
            Quick Start Guide
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index}>
              <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/70 transition-colors">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 flex-shrink-0">
                  {step.icon}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">
                      {index + 1}. {step.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {step.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <Separator className="my-2 ml-12" />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-blue-800">Pro Tip</span>
          </div>
          <p className="text-sm text-blue-700">
            For best results, speak clearly and at a normal pace. The AI works better with natural speech patterns.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}