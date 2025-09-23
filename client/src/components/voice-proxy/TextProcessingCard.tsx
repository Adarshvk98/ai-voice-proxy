import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Volume2, Play, Sparkles, Copy, Check } from 'lucide-react'
import { useState } from 'react'

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
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(processedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const wordCount = testText.trim().split(/\s+/).filter(word => word.length > 0).length

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Text Processing
          <Badge variant="secondary" className="text-xs">
            AI Enhanced
          </Badge>
        </CardTitle>
        <CardDescription>
          Transform your text with AI-powered improvements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">
              Input Text
            </label>
            <Badge variant="outline" className="text-xs">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </Badge>
          </div>
          <Textarea
            placeholder="Enter text to improve with AI..."
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="min-h-[120px] resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows={5}
          />
        </div>
        
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
              <span className="text-sm text-gray-600">AI is processing your text...</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        )}
        
        <Button 
          onClick={onProcessText}
          disabled={!testText.trim() || isProcessing}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
          size="lg"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Enhance Text with AI
            </>
          )}
        </Button>

        {processedText && (
          <div className="space-y-3">
            <Alert variant="success">
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Text successfully enhanced! Here's your improved version:
              </AlertDescription>
            </Alert>
            
            <div className="relative">
              <label className="text-sm font-medium mb-2 block">
                Enhanced Text
              </label>
              <div className="relative p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="text-gray-800 leading-relaxed">
                  {processedText}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              {copied && (
                <Badge variant="success" className="mt-2 text-xs">
                  Copied to clipboard!
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}