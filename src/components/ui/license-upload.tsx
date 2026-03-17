'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { imageUploadApi, UploadConfig } from '@/lib/api/image-upload';
import { getImageUrl, getRelativePath } from '@/utils/image-utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface LicenseUploadProps {
    value?: string; // Relative path (stored in DB)
    onChange: (path: string) => void; // Callback with relative path
    disabled?: boolean;
    className?: string;
    label?: string;
}

export function LicenseUpload({
    value,
    onChange,
    disabled = false,
    className,
    label = "Upload Customer License"
}: LicenseUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [config, setConfig] = useState<UploadConfig | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    // Load upload configuration
    useEffect(() => {
        imageUploadApi.getUploadConfig()
            .then((response) => {
                setConfig(response.data);
            })
            .catch(() => {
                setConfig({
                    maxFileSize: 5 * 1024 * 1024,
                    maxFileSizeMB: 5,
                    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'pdf'],
                    maxFiles: 1,
                });
            });
    }, []);

    const validateFile = useCallback((file: File): string | null => {
        if (!config) return null;

        if (file.size > config.maxFileSize) {
            return `File "${file.name}" exceeds maximum size of ${config.maxFileSizeMB}MB`;
        }

        const allowedTypes = [...config.allowedTypes, 'application/pdf'];
        if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
            return `File type ${file.type} is not allowed.`;
        }

        return null;
    }, [config]);

    const handleUpload = useCallback(async (file: File) => {
        const error = validateFile(file);
        if (error) {
            toast.error(error);
            return;
        }

        setUploading(true);
        try {
            const response = await imageUploadApi.uploadImages([file], 'customers/licenses');

            if (response.data.paths && response.data.paths.length > 0) {
                const path = response.data.paths[0];
                onChange(path);
                toast.success('License uploaded successfully');
            }

            if (response.data.errors && response.data.errors.length > 0) {
                response.data.errors.forEach((error) => toast.error(error));
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error?.response?.data?.message || error?.message || 'Failed to upload license');
        } finally {
            setUploading(false);
        }
    }, [onChange, validateFile]);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            handleUpload(files[0]);
        }
    }, [handleUpload]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    }, [handleUpload]);

    const handleRemove = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!value) return;

        const pathToRemove = value;
        onChange('');

        try {
            await imageUploadApi.deleteImage(getRelativePath(pathToRemove));
        } catch (error) {
            console.error('Failed to delete from server:', error);
        }
    }, [value, onChange]);

    const previewUrl = value ? getImageUrl(value) : null;
    const isPdf = value?.toLowerCase().endsWith('.pdf');

    return (
        <div className={cn("space-y-4", className)}>
            <div
                className={cn(
                    "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
                    dragActive ? "border-cyan-500 bg-cyan-50/50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50",
                    value ? "border-solid border-green-200 bg-green-50/10" : "p-6",
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !disabled && !uploading && !value && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    disabled={disabled || uploading}
                    className="hidden"
                />

                {uploading ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-3">
                        <div className="relative">
                            <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-cyan-600">
                                UP
                            </div>
                        </div>
                        <p className="text-sm font-medium text-cyan-600 animate-pulse">Uploading License...</p>
                    </div>
                ) : value ? (
                    <div className="relative aspect-[16/9] w-full">
                        {isPdf ? (
                            <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl">
                                <FileText className="h-12 w-12 text-blue-500 mb-2" />
                                <p className="text-sm font-medium text-gray-700">License Document (PDF)</p>
                            </div>
                        ) : (
                            <img
                                src={previewUrl!}
                                alt="License Preview"
                                className="w-full h-full object-contain bg-white rounded-xl shadow-inner"
                            />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleRemove}
                                className="h-10 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-transform"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Remove
                            </Button>
                        </div>
                        <div className="absolute top-3 right-3">
                            <div className="bg-green-500 text-white p-1 rounded-full shadow-lg">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Upload className="h-8 w-8 text-cyan-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-base font-semibold text-gray-900">{label}</p>
                            <p className="text-xs text-gray-500">Drag and drop or click to upload (Image or PDF)</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                            <span className="px-2 py-1 bg-gray-100 rounded">JPG</span>
                            <span className="px-2 py-1 bg-gray-100 rounded">PNG</span>
                            <span className="px-2 py-1 bg-gray-100 rounded">PDF</span>
                            <span>MAX {config?.maxFileSizeMB || 5}MB</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
