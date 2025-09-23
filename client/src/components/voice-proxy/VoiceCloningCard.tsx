import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Mic, Square, Volume2, Upload, CheckCircle, AlertTriangle, Sparkles, AudioWaveform } from 'lucide-react'
import { API_BASE_URL } from './types'

interface VoiceCloningProps {
  voiceName: string
  setVoiceName: (value: string) => void
  isConnected: boolean
  onCloneVoice: () => void
}

export function VoiceCloningCard({
  voiceName,
  setVoiceName,
  isConnected,
  onCloneVoice
}: VoiceCloningProps) {
  // Local state for recording functionality
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)

  // Recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      const startTime = Date.now()
      
      // Update duration every second
      const interval = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)

      recorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      recorder.onstop = () => {
        clearInterval(interval)
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setRecordedAudio(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setRecordingDuration(0)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Error accessing microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setAudioUrl(URL.createObjectURL(file))
      setRecordedAudio(null) // Clear recorded audio when file is selected
    }
  }

  const uploadAudioForCloning = async () => {
    if (!voiceName.trim()) {
      alert('Please enter a voice name first')
      return
    }

    const audioToUpload = recordedAudio || selectedFile
    if (!audioToUpload) {
      alert('Please record audio or select a file first')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('audio', audioToUpload, 'voice-sample.wav')
      formData.append('voiceName', voiceName)

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch(`${API_BASE_URL}/api/voice/clone`, {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        setTimeout(() => {
          alert('Voice cloned successfully!')
          // Clear the form
          setRecordedAudio(null)
          setSelectedFile(null)
          setAudioUrl(null)
          setVoiceName('')
          setIsUploading(false)
          setUploadProgress(0)
        }, 500)
      } else {
        const error = await response.text()
        alert(`Error cloning voice: ${error}`)
        setIsUploading(false)
        setUploadProgress(0)
      }
    } catch (error) {
      console.error('Error uploading audio:', error)
      alert('Error uploading audio file')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Cloning
          <Badge variant="secondary" className="text-xs">
            AI Powered
          </Badge>
        </CardTitle>
        <CardDescription>
          Clone your voice for personalized TTS with advanced AI technology
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Name Input */}
        <div className="max-w-md">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">
              Voice Name
            </label>
            <Badge variant="outline" className="text-xs">
              Required
            </Badge>
          </div>
          <Input
            placeholder="Enter a unique name for your voice..."
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Voice Sample Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <label className="text-sm font-medium">
              Voice Sample
            </label>
            <Badge variant="info" className="text-xs">
              High Quality Recommended
            </Badge>
          </div>
          
          {/* Recording and Upload Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Recording Section */}
            <div className="border-2 border-dashed border-purple-200 rounded-lg p-4 space-y-3 hover:border-purple-300 transition-colors">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Mic className="h-4 w-4 text-purple-500" />
                Record Live Audio
                {isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    RECORDING
                  </Badge>
                )}
              </h4>
              
              {isRecording && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AudioWaveform className="h-4 w-4 text-red-500 animate-pulse" />
                    <span className="text-sm text-gray-600">
                      Recording: {formatDuration(recordingDuration)}
                    </span>
                  </div>
                  <Progress value={(recordingDuration % 60) * 1.67} className="h-2" />
                </div>
              )}
              
              <div className="space-y-2">
                <Button
                  onClick={startRecording}
                  disabled={isRecording || !isConnected}
                  variant={isRecording ? "destructive" : "default"}
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isRecording ? (
                    <>
                      <div className="animate-pulse rounded-full h-3 w-3 bg-red-500 mr-2" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
                
                {isRecording && (
                  <Button
                    onClick={stopRecording}
                    variant="outline"
                    size="sm"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>
              
              {!isConnected && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Connection required for recording.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* File Upload Section */}
            <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 space-y-3 hover:border-blue-300 transition-colors">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-500" />
                Upload Audio File
                {selectedFile && (
                  <Badge variant="success" className="text-xs">
                    FILE SELECTED
                  </Badge>
                )}
              </h4>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-blue-500 file:to-purple-500 file:text-white hover:file:from-blue-600 hover:file:to-purple-600 file:cursor-pointer"
                />
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• WAV, MP3, M4A, FLAC supported</p>
                  <p>• Minimum 10 seconds recommended</p>
                  <p>• Clear speech works best</p>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Preview */}
          {audioUrl && (
            <Alert variant="success" className="space-y-3 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <h4 className="text-sm font-medium">Audio Preview Ready</h4>
              </div>
              <div className="space-y-3">
                <audio controls className="w-full max-w-md rounded-lg">
                  <source src={audioUrl} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-xs">
                    {recordedAudio ? 'Recorded Audio' : 'Uploaded File'}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Ready for voice cloning
                  </span>
                </div>
              </div>
            </Alert>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500 animate-spin" />
              <span className="text-sm font-medium">Processing voice clone...</span>
              <Badge variant="info" className="text-xs">
                {uploadProgress}%
              </Badge>
            </div>
            <Progress value={uploadProgress} className="h-3" />
            <p className="text-xs text-gray-500">
              Training AI model with your voice sample...
            </p>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button 
            onClick={uploadAudioForCloning}
            disabled={!voiceName.trim() || (!recordedAudio && !selectedFile) || !isConnected || isUploading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            size="lg"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Cloning Voice...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Clone Voice with Audio
              </>
            )}
          </Button>
          
          <div className="space-y-3 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Already have audio uploaded?</span>
              <Badge variant="outline" className="text-xs">
                API Method
              </Badge>
            </div>
            <Button 
              onClick={onCloneVoice}
              disabled={!voiceName.trim() || !isConnected}
              variant="outline"
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Clone Voice (API Only)
            </Button>
            <p className="text-xs text-gray-500">
              Use this if you've already uploaded audio via API endpoints
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}