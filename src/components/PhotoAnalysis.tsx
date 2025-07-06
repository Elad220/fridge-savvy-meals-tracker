import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FoodItem } from '@/types';
import { PhotoAnalysisEditForm } from './PhotoAnalysisEditForm';

interface PhotoAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (item: Omit<FoodItem, 'id' | 'userId'>) => void;
  userId: string;
}

export const PhotoAnalysis = ({ isOpen, onClose, onAnalysisComplete, userId }: PhotoAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImages, setSelectedImages] = useState<{id: string; url: string}[]>([]);
  const [analysisResult, setAnalysisResult] = useState<{
    suggested_name: string;
    item_type: 'cooked_meal' | 'raw_material';
    expiration_date: string | null;
    confidence: string;
  } | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newImages = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file
    }));

    // Convert files to data URLs and add to state
    newImages.forEach(({ id, file }) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImages(prev => [...prev, { id, url: result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const analyzePhoto = async () => {
    if (selectedImages.length === 0) {
      toast({
        title: 'No images selected',
        description: 'Please select or take at least one photo.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Validate images before sending
      const validImages = selectedImages.filter(img => img.url && img.url.length > 0);
      
      if (validImages.length === 0) {
        throw new Error('No valid images to analyze');
      }

      // Send all selected images for analysis
      const { data, error } = await supabase.functions.invoke('analyze-photo', {
        body: {
          images: validImages.map(img => img.url), // Send array of all image URLs
          userId: userId,
        },
      });

      if (error) {
        throw error;
      }

      // Validate the response
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from analysis service');
      }

      console.log('Photo analysis result:', data);
      
      // Store analysis result and show edit form
      setAnalysisResult(data);
      setShowEditForm(true);
      
      toast({
        title: 'Analysis complete',
        description: `Detected: ${data.suggested_name}. Review and edit the details before adding.`,
      });
      
    } catch (error: any) {
      console.error('Error analyzing photo:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to analyze the photo. Please try again.';
      
      if (error.message) {
        if (error.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('API key')) {
          errorMessage = 'Invalid API configuration. Please check your settings.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Analysis failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditFormSubmit = (item: Omit<FoodItem, 'id' | 'userId'>) => {
    onAnalysisComplete(item);
    handleReset();
  };

  const handleEditFormClose = () => {
    setShowEditForm(false);
  };

  const handleReset = () => {
    setSelectedImages([]);
    setAnalysisResult(null);
    setShowEditForm(false);
    setIsAnalyzing(false);
    onClose();
  };

  const resetAnalysis = () => {
    setSelectedImages([]);
    setAnalysisResult(null);
    setShowEditForm(false);
    setIsAnalyzing(false);
  };

  return (
    <>
      <Dialog open={isOpen && !showEditForm} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Analyze Food Photo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedImages.length === 0 ? (
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
                    multiple
                  />
                  <label htmlFor="camera-input">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photos
                      </span>
                    </Button>
                  </label>
                  
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="upload-input"
                    multiple
                  />
                  <label htmlFor="upload-input">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photos
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {selectedImages.length} {selectedImages.length === 1 ? 'photo' : 'photos'} selected. All photos will be analyzed together to better identify the food item.
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                  {selectedImages.map((img, index) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.url}
                        alt={`Selected food item ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={analyzePhoto}
                    disabled={isAnalyzing || selectedImages.length === 0}
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      `Analyze ${selectedImages.length > 1 ? 'All Photos' : 'Photo'}`
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetAnalysis}
                    disabled={isAnalyzing}
                  >
                    Reset All
                  </Button>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="add-more-input"
                    multiple
                  />
                  <label htmlFor="add-more-input" className="flex-1">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Plus className="w-4 h-4 mr-2" />
                        Add More
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {analysisResult && (
        <PhotoAnalysisEditForm
          isOpen={showEditForm}
          onClose={handleEditFormClose}
          onSubmit={handleEditFormSubmit}
          analysisData={analysisResult}
        />
      )}
    </>
  );
};
