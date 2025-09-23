import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function InstructionsCard() {
  return (
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
  )
}