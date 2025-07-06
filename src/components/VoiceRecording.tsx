import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, Square, Play, Pause, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FoodItem } from '@/types';
import { VoiceRecordingEditForm } from './VoiceRecordingEditForm';

interface VoiceRecordingProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (items: Omit<FoodItem, 'id' | 'userId'>[]) => void;
  userId: string;
}

export const VoiceRecording = ({ isOpen, onClose, onAnalysisComplete, userId }: VoiceRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    items: Array<{
      name: string;
      item_type: 'cooked_meal' | 'raw_material';
      quantity: number;
      unit: string;
      estimated_freshness_days: number;
    }>;
    confidence: string;
  } | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setRecordedBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: 'Recording started',
        description: 'Speak clearly about the items you want to add to your inventory.',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording failed',
        description: 'Could not access microphone. Please check your permissions.',
        variant: 'destructive',
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: 'Recording stopped',
        description: 'You can now play back your recording or analyze it.',
      });
    }
  }, [isRecording]);

  const playRecording = useCallback(() => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioUrl, isPlaying]);

  const analyzeRecording = async () => {
    if (!recordedBlob) {
      toast({
        title: 'No recording found',
        description: 'Please record your voice first.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Read the recorded audio blob as a Data URL (includes the MIME prefix)
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          // Keep the full data URL so the server can reliably determine the MIME type
          resolve(dataUrl);
        };
      });
      reader.readAsDataURL(recordedBlob);
      const base64Audio = await base64Promise;

      // Send audio for analysis
      const { data, error } = await supabase.functions.invoke('analyze-voice-recording', {
        body: {
          audio: base64Audio,
          userId: userId,
        },
      });

      if (error) {
        throw error;
      }

      console.log('Voice analysis result:', data);
      
      // Store analysis result and show edit form
      setAnalysisResult(data);
      setShowEditForm(true);
      
      toast({
        title: 'Analysis complete',
        description: `Detected ${data.items.length} item${data.items.length === 1 ? '' : 's'}. Review and edit the details before adding.`,
      });
      
    } catch (error: any) {
      console.error('Error analyzing voice recording:', error);
      toast({
        title: 'Analysis failed',
        description: error.message || 'Failed to analyze the recording. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditFormSubmit = (items: Omit<FoodItem, 'id' | 'userId'>[]) => {
    onAnalysisComplete(items);
    handleReset();
  };

  const handleEditFormClose = () => {
    setShowEditForm(false);
  };

  const handleReset = () => {
    setRecordedBlob(null);
    setAudioUrl(null);
    setAnalysisResult(null);
    setShowEditForm(false);
    setIsRecording(false);
    setIsAnalyzing(false);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onClose();
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setAudioUrl(null);
    setAnalysisResult(null);
    setShowEditForm(false);
    setIsRecording(false);
    setIsAnalyzing(false);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showEditForm} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Voice Recording</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Record yourself describing the items you want to add to your inventory. 
              For example: "I bought 2 apples, 1 loaf of bread, and 500g of chicken breast."
            </div>
            
            {!recordedBlob ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950/20">
                  <Mic className={`w-8 h-8 ${isRecording ? 'text-red-500 animate-pulse' : 'text-blue-500'}`} />
                </div>
                
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground text-center">
                  Recording ready! You can play it back or analyze it.
                </div>
                
                <audio
                  ref={audioRef}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                  src={audioUrl || undefined}
                />
                
                <div className="flex gap-2">
                  <Button
                    onClick={playRecording}
                    variant="outline"
                    className="flex-1"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={analyzeRecording}
                    disabled={isAnalyzing}
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Recording'
                    )}
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  onClick={resetRecording}
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  Record Again
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {analysisResult && (
        <VoiceRecordingEditForm
          isOpen={showEditForm}
          onClose={handleEditFormClose}
          onSubmit={handleEditFormSubmit}
          analysisData={analysisResult}
        />
      )}
    </>
  );
};