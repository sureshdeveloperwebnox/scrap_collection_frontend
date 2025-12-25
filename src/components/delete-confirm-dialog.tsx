'use client';

import React from 'react';
import { Trash2, Loader2, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    isLoading?: boolean;
    itemTitle?: string;
    itemSubtitle?: string;
    icon?: React.ReactNode;
}

export function DeleteConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Item",
    description = "Are you sure you want to delete this item? This action cannot be undone.",
    confirmText = "Delete",
    isLoading = false,
    itemTitle,
    itemSubtitle,
    icon
}: DeleteConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
            <DialogContent className="sm:max-w-[425px] [&>button]:hidden p-0 overflow-hidden border-none shadow-2xl">
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 animate-pulse">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-900">{title}</span>
                                <span className="text-xs font-normal text-red-500 mt-0.5 tracking-wide uppercase italic">Critical Action</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-2">
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            {description}
                        </p>

                        {(itemTitle || itemSubtitle) && (
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
                                <div className="flex items-center gap-4 relative z-10">
                                    {icon ? (
                                        <div className="flex-shrink-0">
                                            {icon}
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100">
                                            <span className="text-red-500 font-bold text-sm">
                                                {itemTitle ? itemTitle.charAt(0).toUpperCase() : 'D'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {itemTitle || 'Item Details'}
                                        </p>
                                        {itemSubtitle && (
                                            <p className="text-xs text-gray-500 mt-0.5 truncate font-medium">
                                                {itemSubtitle}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 font-semibold px-5 transition-all"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 px-6 font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" />
                                <span>{confirmText}</span>
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
