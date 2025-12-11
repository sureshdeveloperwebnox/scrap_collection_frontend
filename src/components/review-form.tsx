'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Review } from '@/types';
import { useCreateReview, useUpdateReview } from '@/hooks/use-reviews';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  review?: Review;
  orderId: string;
  customerId: string;
  collectorId: string;
  organizationId: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (review: Partial<Review>) => void;
}

export function ReviewForm({ 
  review, 
  orderId, 
  customerId, 
  collectorId, 
  organizationId,
  isOpen, 
  onClose, 
  onSubmit 
}: ReviewFormProps) {
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    if (review) {
      setFormData({
        rating: review.rating || 5,
        comment: review.comment || '',
      });
    } else {
      setFormData({
        rating: 5,
        comment: '',
      });
    }
  }, [review, isOpen]);

  const createReviewMutation = useCreateReview();
  const updateReviewMutation = useUpdateReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (review) {
        await updateReviewMutation.mutateAsync({
          id: review.id,
          data: formData
        });
        toast.success('Review updated successfully!');
      } else {
        await createReviewMutation.mutateAsync({
          orderId,
          customerId,
          collectorId,
          organizationId,
          ...formData
        });
        toast.success('Review submitted successfully!');
      }
      
      if (onSubmit) {
        onSubmit(formData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving review:', error);
      toast.error(review ? 'Failed to update review' : 'Failed to submit review');
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const isLoading = createReviewMutation.isPending || updateReviewMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {review ? 'Edit Review' : 'Submit Review'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="rating" className="text-sm font-semibold">Rating *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  disabled={isLoading}
                  className={`transition-all duration-200 ${
                    star <= formData.rating
                      ? 'text-yellow-400 scale-110'
                      : 'text-gray-300 hover:text-yellow-200'
                  }`}
                >
                  <Star className="h-8 w-8 fill-current" />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {formData.rating} / 5
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-semibold">Comment</Label>
            <textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              rows={4}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none"
              placeholder="Share your experience..."
            />
          </div>

          <DialogFooter className="pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 bg-white animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {review ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                review ? 'Update Review' : 'Submit Review'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
