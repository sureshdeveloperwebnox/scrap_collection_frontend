'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { City } from '@/lib/api/cities';
import { useCreateCity, useUpdateCity } from '@/hooks/use-cities';
import { toast } from 'sonner';
import { GoogleMapPicker } from '@/components/google-map-picker';

interface CityFormProps {
  city?: City;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (city: Partial<City>) => void;
}

export function CityForm({ city, isOpen, onClose, onSubmit }: CityFormProps) {
  const [formData, setFormData] = useState<{ name: string; latitude: number; longitude: number; isActive: boolean }>({
    name: '',
    latitude: 0,
    longitude: 0,
    isActive: true,
  });

  // Initialize form data when city prop changes
  useEffect(() => {
    if (city) {
      setFormData({
        name: city.name || '',
        latitude: city.latitude || 0,
        longitude: city.longitude || 0,
        isActive: city.isActive ?? true,
      });
    } else {
      // Reset form for new city
      setFormData({
        name: '',
        latitude: 0,
        longitude: 0,
        isActive: true,
      });
    }
  }, [city, isOpen]);

  // API mutations
  const createCityMutation = useCreateCity();
  const updateCityMutation = useUpdateCity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate coordinates
    if (formData.latitude < -90 || formData.latitude > 90) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }
    if (formData.longitude < -180 || formData.longitude > 180) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }
    
    try {
      if (city) {
        // Update existing city
        await updateCityMutation.mutateAsync({
          id: city.id.toString(),
          data: {
            name: formData.name,
            latitude: formData.latitude,
            longitude: formData.longitude,
            isActive: formData.isActive,
          }
        });
        toast.success('City updated successfully!');
      } else {
        // Create new city
        await createCityMutation.mutateAsync({
          name: formData.name,
          latitude: formData.latitude,
          longitude: formData.longitude,
          isActive: formData.isActive,
        });
        toast.success('City created successfully!');
      }
      
      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(formData);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error saving city:', error);
      toast.error(error?.message || (city ? 'Failed to update city' : 'Failed to create city'));
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createCityMutation.isPending || updateCityMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{city ? 'Edit City' : 'Add New City'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">City Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              disabled={isLoading}
              placeholder="e.g., Sydney, Melbourne"
            />
          </div>
          
          <GoogleMapPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={(lat, lng) => {
              setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
            }}
          />

          {/* Only show active toggle when editing */}
          {city && (
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                disabled={isLoading}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          )}

          <DialogFooter>
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
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {city ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                city ? 'Update City' : 'Create City'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

