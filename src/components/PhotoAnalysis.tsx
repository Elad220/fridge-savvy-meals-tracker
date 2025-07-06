import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FoodItem } from '@/types';
import { PhotoAnalysisEditForm } from './PhotoAnalysisEditForm';
import { BulkPhotoAnalysisEditForm } from './BulkPhotoAnalysisEditForm';

interface PhotoAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (item: Omit<FoodItem, 'id' | 'userId'>) => void;
  onBulkAnalysisComplete: (items: Omit<FoodItem, 'id' | 'userId'>[]) => void;
  userId: string;
}

// Replace separate itemGroups and currentGroupIndex with a single state object
type GroupState = {
  itemGroups: Array<{
    id: string;
    images: {id: string; url: string}[];
  }>;
  currentGroupIndex: number;
};

export const PhotoAnalysis = ({ isOpen, onClose, onAnalysisComplete, onBulkAnalysisComplete, userId }: PhotoAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [groupState, setGroupState] = useState<GroupState>({
    itemGroups: [],
    currentGroupIndex: 0,
  });
  const [analysisMode, setAnalysisMode] = useState<'single' | 'bulk'>('single');
  const [analysisResult, setAnalysisResult] = useState<{
    suggested_name: string;
    item_type: 'cooked_meal' | 'raw_material';
    expiration_date: string | null;
    confidence: string;
  } | null>(null);
  const [bulkAnalysisResult, setBulkAnalysisResult] = useState<{
    items: Array<{
      suggested_name: string;
      item_type: 'cooked_meal' | 'raw_material';
      estimated_amount: number;
      estimated_unit: string;
      expiration_date?: string | null;
      confidence?: string;
    }>;
    confidence: string;
  } | null>(null);
  const [dialogMode, setDialogMode] = useState<'main' | 'edit'>('main');

  // Refs for file inputs to reset them after use
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const addMoreCurrentItemRef = useRef<HTMLInputElement>(null);
  const addMoreNextItemRef = useRef<HTMLInputElement>(null);

  // Helper functions for managing item groups
  const getCurrentGroup = () => {
    if (groupState.itemGroups.length === 0) {
      const newGroup = { id: `group-${Date.now()}`, images: [] };
      setGroupState({ itemGroups: [newGroup], currentGroupIndex: 0 });
      return newGroup;
    }
    return groupState.itemGroups[groupState.currentGroupIndex];
  };

  const getCurrentImages = () => {
    const currentGroup = getCurrentGroup();
    return currentGroup.images;
  };

  const addImageToCurrentGroup = (image: {id: string; url: string}) => {
    setGroupState(prev => {
      const newGroups = [...prev.itemGroups];
      if (newGroups.length === 0) {
        newGroups.push({ id: `group-${Date.now()}`, images: [image] });
        return { itemGroups: newGroups, currentGroupIndex: 0 };
      } else {
        newGroups[prev.currentGroupIndex].images.push(image);
        return { ...prev, itemGroups: newGroups };
      }
    });
  };

  const removeImageFromCurrentGroup = (imageId: string) => {
    setGroupState(prev => {
      const newGroups = [...prev.itemGroups];
      newGroups[prev.currentGroupIndex].images = newGroups[prev.currentGroupIndex].images.filter(img => img.id !== imageId);
      return { ...prev, itemGroups: newGroups };
    });
  };

  const addNewItemGroup = () => {
    setGroupState(prev => {
      const newGroups = [...prev.itemGroups, { id: `group-${Date.now()}`, images: [] }];
      return { itemGroups: newGroups, currentGroupIndex: newGroups.length - 1 };
    });
  };

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, resetting states');
      setGroupState({ itemGroups: [], currentGroupIndex: 0 });
      setAnalysisResult(null);
      setBulkAnalysisResult(null);
      setAnalysisMode('single');
      setDialogMode('main');
      setIsAnalyzing(false);
      // Reset all file inputs
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (uploadInputRef.current) uploadInputRef.current.value = '';
      if (addMoreCurrentItemRef.current) addMoreCurrentItemRef.current.value = '';
      if (addMoreNextItemRef.current) addMoreNextItemRef.current.value = '';
    }
  }, [isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, isForNextItem: boolean = false) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const image = { id: Math.random().toString(36).substr(2, 9), url: result };

        if (isForNextItem) {
          setGroupState(prev => {
            // Always append to previous groups!
            const newGroups = [
              ...prev.itemGroups,
              { id: `group-${Date.now()}`, images: [image] }
            ];
            return { itemGroups: newGroups, currentGroupIndex: newGroups.length - 1 };
          });
        } else {
          addImageToCurrentGroup(image);
        }
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const removeImage = (id: string) => {
    removeImageFromCurrentGroup(id);
  };

  const analyzePhoto = async () => {
    if (analysisMode === 'bulk') {
      // Gather all groups' images as an array of arrays
      const allGroups = groupState.itemGroups
        .filter(group => group.images.length > 0)
        .map(group => group.images.map(img => img.url));
      if (allGroups.length === 0) {
        toast({
          title: 'No images selected',
          description: 'Please select or take at least one photo.',
          variant: 'destructive',
        });
        return;
      }
      setIsAnalyzing(true);
      try {
        const { data, error } = await supabase.functions.invoke('analyze-photo-bulk', {
          body: {
            groups: allGroups, // send as 'groups' not 'images'
            userId: userId,
          },
        });
        if (error) throw error;
        if (!data || typeof data !== 'object') throw new Error('Invalid response from analysis service');
        setBulkAnalysisResult(data);
        setDialogMode('edit');
        toast({
          title: 'Bulk analysis complete',
          description: `Detected ${data.items.length} item${data.items.length === 1 ? '' : 's'}. Review and edit the details before adding.`,
        });
      } catch (error: unknown) {
        toast({
          title: 'Analysis failed',
          description: error instanceof Error ? error.message : 'Failed to analyze the photos. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    const currentImages = getCurrentImages();
    if (currentImages.length === 0) {
      console.log('No images selected for analysis');
      toast({
        title: 'No images selected',
        description: 'Please select or take at least one photo.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Starting photo analysis with', currentImages.length, 'images');
    setIsAnalyzing(true);

    try {
      // Validate images before sending
      const validImages = currentImages.filter(img => img.url && img.url.length > 0);
      
      console.log('Valid images:', validImages.length, 'out of', currentImages.length);
      
      if (validImages.length === 0) {
        throw new Error('No valid images to analyze');
      }

      console.log('Sending', validImages.length, 'images for analysis');
      console.log('User ID:', userId);
      console.log('Analysis mode:', analysisMode);

      // Send all selected images for analysis based on mode
      const functionName = analysisMode === 'bulk' ? 'analyze-photo-bulk' : 'analyze-photo';
      const { data, error } = await supabase.functions.invoke(functionName, {
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
      
      if (analysisMode === 'bulk') {
        // Handle bulk analysis result
        if (data.items && Array.isArray(data.items)) {
          setBulkAnalysisResult(data);
          setDialogMode('edit');
          toast({
            title: 'Bulk analysis complete',
            description: `Detected ${data.items.length} item${data.items.length === 1 ? '' : 's'}. Review and edit the details before adding.`,
          });
        } else {
          throw new Error('Invalid bulk analysis response format');
        }
      } else {
        // Handle single item analysis result
        setAnalysisResult(data);
        setDialogMode('edit');
        toast({
          title: 'Analysis complete',
          description: `Detected: ${data.suggested_name}. Review and edit the details before adding.`,
        });
      }
      
    } catch (error: unknown) {
      console.error('Error analyzing photo:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to analyze the photo. Please try again.';
      
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
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
        description: error instanceof Error ? error.message : 'Failed to analyze the photos. Please try again.',
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

  const handleBulkEditFormSubmit = (items: Omit<FoodItem, 'id' | 'userId'>[]) => {
    onBulkAnalysisComplete(items);
    handleReset();
  };

  const handleEditFormClose = () => {
    setDialogMode('main');
    setAnalysisResult(null);
    setBulkAnalysisResult(null);
  };

  const handleReset = () => {
    setGroupState({ itemGroups: [], currentGroupIndex: 0 });
    setAnalysisResult(null);
    setBulkAnalysisResult(null);
    setAnalysisMode('single');
    setDialogMode('main');
    setIsAnalyzing(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    if (addMoreCurrentItemRef.current) addMoreCurrentItemRef.current.value = '';
    if (addMoreNextItemRef.current) addMoreNextItemRef.current.value = '';
    onClose();
  };

  const resetAnalysis = () => {
    setGroupState({ itemGroups: [], currentGroupIndex: 0 });
    setAnalysisResult(null);
    setBulkAnalysisResult(null);
    setAnalysisMode('single');
    setDialogMode('main');
    setIsAnalyzing(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    if (addMoreCurrentItemRef.current) addMoreCurrentItemRef.current.value = '';
    if (addMoreNextItemRef.current) addMoreNextItemRef.current.value = '';
  };

  return (
    <>
      <Dialog open={isOpen && dialogMode === 'main'} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analyze Food Photo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {groupState.itemGroups.length === 0 || getCurrentImages().length === 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Take or upload photos of your food items for AI analysis
                </div>
                
                {/* Analysis Mode Selection */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Analysis Mode:</div>
                  <div className="flex gap-2">
                    <Button
                      variant={analysisMode === 'single' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAnalysisMode('single')}
                      className="flex-1"
                    >
                      Single Item
                    </Button>
                    <Button
                      variant={analysisMode === 'bulk' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAnalysisMode('bulk')}
                      className="flex-1"
                    >
                      Multiple Items
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {analysisMode === 'single' 
                      ? 'Analyze multiple photos of the same food item (e.g., one showing the name, another showing expiration date)'
                      : 'Analyze photos of different food items to add multiple items at once'
                    }
                  </div>
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
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photos
                  </Button>
                  
                  <Input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="upload-input"
                    multiple
                  />
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => uploadInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photos
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {getCurrentImages().length} {getCurrentImages().length === 1 ? 'photo' : 'photos'} selected for current item. 
                  {analysisMode === 'single' 
                    ? ' All photos will be analyzed together to better identify the food item.'
                    : ' Each photo will be analyzed separately to identify different food items.'
                  }
                </div>
                
                {/* Show all item groups and their images */}
                {groupState.itemGroups.length > 0 && (
                  <div className="space-y-2">
                    {groupState.itemGroups.map((group, groupIdx) => (
                      <div key={group.id} className="mb-2">
                        <div className="text-xs text-muted-foreground mb-1">
                          Item {groupIdx + 1} {groupIdx === groupState.currentGroupIndex && "(current)"}
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1">
                          {group.images.map((img, index) => (
                            <div key={img.id} className="relative group">
                              <img
                                src={img.url}
                                alt={`Item ${groupIdx + 1} photo ${index + 1}`}
                                className="w-full h-20 object-cover rounded-md border"
                              />
                              {/* Remove button for current group only */}
                              {groupIdx === groupState.currentGroupIndex && (
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
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={analyzePhoto}
                    disabled={isAnalyzing || getCurrentImages().length === 0}
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      `Analyze ${getCurrentImages().length > 1 ? 'All Photos' : 'Photo'}`
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetAnalysis}
                    disabled={isAnalyzing}
                  >
                    Reset All
                  </Button>
                </div>
                
                {/* Add More Buttons */}
                <div className="flex gap-2">
                  <Input
                    ref={addMoreCurrentItemRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, false)}
                    className="hidden"
                    id="add-more-current-input"
                    multiple
                  />
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => addMoreCurrentItemRef.current?.click()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add More for Current Item
                  </Button>
                  
                  {analysisMode === 'bulk' && (
                    <>
                      <Input
                        ref={addMoreNextItemRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, true)}
                        className="hidden"
                        id="add-more-next-input"
                        multiple
                      />
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => addMoreNextItemRef.current?.click()}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add More for Next Item
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {analysisResult && (
        <PhotoAnalysisEditForm
          isOpen={dialogMode === 'edit'}
          onClose={handleEditFormClose}
          onSubmit={handleEditFormSubmit}
          analysisData={analysisResult}
        />
      )}

      {bulkAnalysisResult && (
        <BulkPhotoAnalysisEditForm
          isOpen={dialogMode === 'edit'}
          onClose={handleEditFormClose}
          onSubmit={handleBulkEditFormSubmit}
          analysisData={bulkAnalysisResult}
        />
      )}
    </>
  );
};
