
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FoodItem } from '@/types';

interface PhotoAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (analysisData: {
    suggested_name: string;
    item_type: 'cooked_meal' | 'raw_material';
    expiration_date: string | null;
    confidence: string;
  }) => void;
  userId: string;
}

export const PhotoAnalysis = ({ isOpen, onClose, onAnalysisComplete, userId }: PhotoAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePhoto = async () => {
    if (!selectedImage) {
      toast({
        title: 'No image selected',
        description: 'Please select or take a photo first.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-photo', {
        body: {
          image: selectedImage,
          userId: userId,
        },
      });

      if (error) {
        throw error;
      }

      console.log('Photo analysis result:', data);
      
      onAnalysisComplete(data);
      
      toast({
        title: 'Photo analyzed successfully',
        description: `Detected: ${data.suggested_name}`,
      });

      // Reset state and close dialog
      setSelectedImage(null);
      onClose();
      
    } catch (error: any) {
      console.error('Error analyzing photo:', error);
      toast({
        title: 'Analysis failed',
        description: error.message || 'Failed to analyze the photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setIsAnalyzing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Analyze Food Photo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!selectedImage ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Take or upload a photo of your food item for AI analysis
              </div>
              
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  id="camera-input"
                />
                <label htmlFor="camera-input">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </span>
                  </Button>
                </label>
                
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="upload-input"
                />
                <label htmlFor="upload-input">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Photo selected. Click analyze to process with AI.
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={selectedImage}
                  alt="Selected food item"
                  className="w-full h-48 object-cover"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={analyzePhoto}
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Photo'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetAnalysis}
                  disabled={isAnalyzing}
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
