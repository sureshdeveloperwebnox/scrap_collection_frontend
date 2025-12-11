'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { imageUploadApi, UploadConfig } from '@/lib/api/image-upload';
import { getImageUrl, getRelativePath } from '@/utils/image-utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ImageUploadProps {
  value: string[]; // Array of relative paths (stored in DB)
  onChange: (paths: string[]) => void; // Callback with relative paths
  maxFiles?: number;
  uploadType?: string;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
}

export function ImageUpload({
  value = [],
  onChange,
  maxFiles = 10,
  uploadType = 'lead/vehicles/images',
  disabled = false,
  className,
  showPreview = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load upload configuration
  useEffect(() => {
    imageUploadApi.getUploadConfig()
      .then((response) => {
        setConfig(response.data);
      })
      .catch(() => {
        // Use defaults if config fails to load
        setConfig({
          maxFileSize: 5 * 1024 * 1024,
          maxFileSizeMB: 5,
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
          maxFiles: maxFiles,
        });
      });
  }, [maxFiles]);

  const validateFile = useCallback((file: File): string | null => {
    if (!config) return null;

    // Check file size
    if (file.size > config.maxFileSize) {
      return `File "${file.name}" exceeds maximum size of ${config.maxFileSizeMB}MB`;
    }

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      return `File "${file.name}" type ${file.type} is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`;
    }

    return null;
  }, [config]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const currentCount = value.length;
    const totalCount = currentCount + fileArray.length;

    // Check max files
    if (totalCount > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed. You already have ${currentCount} image(s).`);
      return;
    }

    // Validate all files
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
    }

    if (validFiles.length === 0) {
      return;
    }

    // Upload files
    setUploading(true);
    try {
      const response = await imageUploadApi.uploadImages(validFiles, uploadType);
      
      if (response.data.paths && response.data.paths.length > 0) {
        // Backend returns relative paths, store them directly
        const newPaths = [...value, ...response.data.paths];
        onChange(newPaths);
        toast.success(`Successfully uploaded ${response.data.paths.length} image(s)`);
      }

      if (response.data.errors && response.data.errors.length > 0) {
        response.data.errors.forEach((error) => toast.error(error));
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      setUploadProgress({});
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [value, onChange, maxFiles, uploadType, validateFile]);

  const handleRemove = useCallback(async (index: number) => {
    const pathToRemove = value[index];
    const newPaths = value.filter((_, i) => i !== index);
    onChange(newPaths);

    // Optionally delete from server (use relative path)
    try {
      const relativePath = getRelativePath(pathToRemove);
      await imageUploadApi.deleteImage(relativePath);
    } catch (error) {
      // Silently fail - image already removed from UI
      console.error('Failed to delete image from server:', error);
    }
  }, [value, onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  const remainingSlots = maxFiles - value.length;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={disabled || uploading || remainingSlots === 0}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Images
            </>
          )}
        </Button>
        {config && (
          <span className="text-sm text-muted-foreground">
            {remainingSlots > 0 ? `${remainingSlots} slot(s) remaining` : 'Maximum images reached'}
          </span>
        )}
      </div>

      {config && (
        <p className="text-xs text-muted-foreground">
          Max {config.maxFileSizeMB}MB per file. Allowed types: {config.allowedTypes.join(', ')}
        </p>
      )}

      {showPreview && value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {value.map((path, index) => {
            // Convert relative path to full URL for display
            const imageUrl = getImageUrl(path);
            return (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                  <img
                    src={imageUrl}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                  disabled={disabled || uploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {!showPreview && value.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span>{value.length} image(s) uploaded</span>
        </div>
      )}
    </div>
  );
}

