import { useState, useRef } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscriptReady: (transcript: string) => void;
  className?: string;
}

export function VoiceRecorder({ onTranscriptReady, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      const mockTranscript = "This is a simulated voice transcription. In production, this would be processed by Whisper API.";
      setTranscript(mockTranscript);
      setIsProcessing(false);
    }, 2000);
  };

  const handleSend = () => {
    if (transcript) {
      onTranscriptReady(transcript);
      setTranscript('');
    }
  };

  return (
    <Card className={cn("glass-dark p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Mic className="h-4 w-4 text-accent" />
          Voice Interview
        </h3>
        {isRecording && (
          <div className="flex items-center gap-2 text-sm text-accent">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Recording...
          </div>
        )}
      </div>

      {transcript && (
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          {transcript}
        </div>
      )}

      <div className="flex gap-2">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="flex-1 bg-accent hover:bg-accent/90"
            disabled={isProcessing}
            aria-label="Start recording"
          >
            <Mic className="h-4 w-4 mr-2" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="flex-1"
            aria-label="Stop recording"
          >
            <MicOff className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        )}
        
        {transcript && (
          <Button
            onClick={handleSend}
            className="bg-primary"
            disabled={isProcessing}
            aria-label="Send transcript"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Voice interviews are processed using AI speech-to-text
      </p>
    </Card>
  );
}
