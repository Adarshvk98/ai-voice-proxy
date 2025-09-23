import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Volume2, Play } from 'lucide-react'

interface TextProcessingProps {
  testText: string
  setTestText: (value: string) => void
  isProcessing: boolean
  processedText: string
  onProcessText: () => void
}

export function TextProcessingCard({
  testText,
  setTestText,
  isProcessing,
  processedText,
  onProcessText
}: TextProcessingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Text Processing
        </CardTitle>
        <CardDescription>
          Test AI text improvement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Input Text
          </label>
          <Textarea
            placeholder="Enter text to improve..."
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="min-h-[120px]"
            rows={5}
          />
        </div>
        
        <Button 
          onClick={onProcessText}
          disabled={!testText.trim() || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Process Text
            </>
          )}
        </Button>

        {processedText && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Improved Text
            </label>
            <div className="p-3 bg-gray-50 rounded-md border">
              {processedText}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}