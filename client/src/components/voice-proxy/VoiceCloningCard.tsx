import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mic, Square, Volume2 } from 'lucide-react'
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

  // Recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setRecordedAudio(blob)
        setAudioUrl(URL.createObjectURL(blob))
        
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

    try {
      const formData = new FormData()
      formData.append('audio', audioToUpload, 'voice-sample.wav')
      formData.append('voiceName', voiceName)

      const response = await fetch(`${API_BASE_URL}/api/voice/clone`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        alert('Voice cloned successfully!')
        // Clear the form
        setRecordedAudio(null)
        setSelectedFile(null)
        setAudioUrl(null)
        setVoiceName('')
      } else {
        const error = await response.text()
        alert(`Error cloning voice: ${error}`)
      }
    } catch (error) {
      console.error('Error uploading audio:', error)
      alert('Error uploading audio file')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Cloning</CardTitle>
        <CardDescription>
          Clone your voice for personalized TTS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Name Input */}
        <div className="max-w-md">
          <label className="text-sm font-medium mb-2 block">
            Voice Name
          </label>
          <Input
            placeholder="Enter voice name..."
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
          />
        </div>

        {/* Voice Sample Section */}
        <div className="space-y-4">
          <label className="text-sm font-medium block">
            Voice Sample
          </label>
          
          {/* Recording and Upload Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Recording Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Record Live Audio
              </h4>
              <div className="space-y-2">
                <Button
                  onClick={startRecording}
                  disabled={isRecording || !isConnected}
                  variant={isRecording ? "destructive" : "default"}
                  size="sm"
                  className="w-full"
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
                    className="w-full"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>
            </div>

            {/* File Upload Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Upload Audio File
              </h4>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500">
                  Supports WAV, MP3, M4A, and other audio formats
                </p>
              </div>
            </div>
          </div>

          {/* Audio Preview */}
          {audioUrl && (
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <h4 className="text-sm font-medium">Audio Preview</h4>
              <div className="space-y-3">
                <audio controls className="w-full max-w-md">
                  <source src={audioUrl} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-sm text-gray-600">
                    {recordedAudio ? 'Recorded audio ready for cloning' : 'Uploaded file ready for cloning'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2 border-t">
          <Button 
            onClick={uploadAudioForCloning}
            disabled={!voiceName.trim() || (!recordedAudio && !selectedFile) || !isConnected}
            className="w-full md:w-auto"
            size="lg"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Clone Voice with Audio
          </Button>
          
          <div className="space-y-2">
            <Button 
              onClick={onCloneVoice}
              disabled={!voiceName.trim() || !isConnected}
              variant="outline"
              className="w-full md:w-auto"
            >
              Clone Voice (API Only)
            </Button>
            <p className="text-xs text-gray-500">
              Use this if you've already uploaded audio via API
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}