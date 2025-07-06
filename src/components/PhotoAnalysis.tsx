import { useState, useRef, useEffect } from 'react';
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

  // Refs for file inputs to reset them after use
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, resetting states');
      setSelectedImages([]);
      setAnalysisResult(null);
      setShowEditForm(false);
      setIsAnalyzing(false);
      // Reset all file inputs
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (uploadInputRef.current) uploadInputRef.current.value = '';
      if (addMoreInputRef.current) addMoreInputRef.current.value = '';
    }
  }, [isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    console.log('Files selected:', files.length, 'files');

    const newImages = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file
    }));

    console.log('Processing', newImages.length, 'images');

    // Convert files to data URLs and add to state
    newImages.forEach(({ id, file }, index) => {
      console.log(`Processing file ${index + 1}:`, file.name, file.type, file.size);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error(`File ${file.name} is not an image:`, file.type);
        toast({
          title: 'Invalid File Type',
          description: `${file.name} is not an image file. Please select an image.`,
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error(`File ${file.name} is too large:`, file.size);
        toast({
          title: 'File Too Large',
          description: `${file.name} is too large. Please select a smaller image (max 10MB).`,
          variant: 'destructive',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log(`File ${index + 1} converted to data URL, length:`, result.length);
        setSelectedImages(prev => {
          const newImages = [...prev, { id, url: result }];
          console.log('Total images now:', newImages.length);
          return newImages;
        });
      };
      reader.onerror = (error) => {
        console.error(`Error reading file ${index + 1}:`, error);
        toast({
          title: 'File Error',
          description: `Failed to read ${file.name}. Please try again.`,
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset the file input to allow selecting the same file again
    event.target.value = '';
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const analyzePhoto = async () => {
    if (selectedImages.length === 0) {
      console.log('No images selected for analysis');
      toast({
        title: 'No images selected',
        description: 'Please select or take at least one photo.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Starting photo analysis with', selectedImages.length, 'images');
    setIsAnalyzing(true);

    try {
      // Validate images before sending
      const validImages = selectedImages.filter(img => img.url && img.url.length > 0);
      
      console.log('Valid images:', validImages.length, 'out of', selectedImages.length);
      
      if (validImages.length === 0) {
        throw new Error('No valid images to analyze');
      }

      console.log('Sending', validImages.length, 'images for analysis');
      console.log('User ID:', userId);

      // Send all selected images for analysis
      const { data, error } = await supabase.functions.invoke('analyze-photo', {
        body: {
          images: validImages.map(img => img.url), // Send array of all image URLs
          userId: userId,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      // Validate the response
      if (!data || typeof data !== 'object') {
        console.error('Invalid response data:', data);
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
    // Reset all file inputs
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    if (addMoreInputRef.current) addMoreInputRef.current.value = '';
    onClose();
  };

  const resetAnalysis = () => {
    setSelectedImages([]);
    setAnalysisResult(null);
    setShowEditForm(false);
    setIsAnalyzing(false);
    // Reset all file inputs
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    if (addMoreInputRef.current) addMoreInputRef.current.value = '';
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
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="camera-input"
                    multiple
                  />
                  <label htmlFor="camera-input">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      asChild
                      onClick={() => {
                        console.log('Camera button clicked');
                        // Small delay to ensure the input is ready
                        setTimeout(() => {
                          if (cameraInputRef.current) {
                            cameraInputRef.current.click();
                          }
                        }, 100);
                      }}
                    >
                      <span>
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photos
                      </span>
                    </Button>
                  </label>
                  
                  <Input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="upload-input"
                    multiple
                  />
                  <label htmlFor="upload-input">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      asChild
                      onClick={() => {
                        console.log('Upload button clicked');
                        // Small delay to ensure the input is ready
                        setTimeout(() => {
                          if (uploadInputRef.current) {
                            uploadInputRef.current.click();
                          }
                        }, 100);
                      }}
                    >
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
                    ref={addMoreInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="add-more-input"
                    multiple
                  />
                  <label htmlFor="add-more-input" className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      asChild
                      onClick={() => {
                        console.log('Add more button clicked');
                        // Small delay to ensure the input is ready
                        setTimeout(() => {
                          if (addMoreInputRef.current) {
                            addMoreInputRef.current.click();
                          }
                        }, 100);
                      }}
                    >
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
