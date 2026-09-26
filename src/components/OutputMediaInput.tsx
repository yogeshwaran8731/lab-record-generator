'use client';

import React, { useState, useRef } from 'react';
import { ImageCropModal } from './ImageCropModal';
import {
  Image as ImageIcon,
  Crop,
  Trash2,
  Terminal,
  Plus,
  Upload,
  CheckCircle2,
} from 'lucide-react';

interface OutputMediaInputProps {
  value: string;
  images?: string[];
  placeholder?: string;
  onChangeText: (text: string) => void;
  onChangeImages: (images: string[]) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export const OutputMediaInput: React.FC<OutputMediaInputProps> = ({
  value,
  images = [],
  placeholder,
  onChangeText,
  onChangeImages,
  onKeyDown,
  inputRef,
}) => {
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [newImageToCrop, setNewImageToCrop] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // Handle uploading one or more files from device
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);

      // Read all selected files as Data URLs
      const readers = files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result?.toString() || '');
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then((newUrls) => {
        const validUrls = newUrls.filter(Boolean);
        if (validUrls.length === 1) {
          // If 1 image selected, open cropper immediately for it
          setNewImageToCrop(validUrls[0]);
          setEditingImageIndex(null);
          setIsCropModalOpen(true);
        } else if (validUrls.length > 1) {
          // If multiple images selected, add all to the list
          onChangeImages([...images, ...validUrls]);
        }
      });

      // Clear input so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  // Save cropped result: either updates existing or appends new
  const handleSaveCropped = (croppedDataUrl: string) => {
    if (editingImageIndex !== null) {
      const updated = [...images];
      updated[editingImageIndex] = croppedDataUrl;
      onChangeImages(updated);
    } else {
      onChangeImages([...images, croppedDataUrl]);
    }
    setEditingImageIndex(null);
    setNewImageToCrop(null);
  };

  // Remove an image by index
  const handleRemoveImage = (indexToRemove: number) => {
    onChangeImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  // Open cropper for an existing image
  const handleEditExisting = (idx: number) => {
    setEditingImageIndex(idx);
    setNewImageToCrop(images[idx]);
    setIsCropModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for uploading multiple images */}
      <input
        ref={multiFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Picture Attachment Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
            Output Pictures / Screenshots ({images.length})
          </span>
          {images.length > 0 ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> {images.length} {images.length === 1 ? 'picture' : 'pictures'} attached
            </span>
          ) : (
            <span className="text-[11px] text-zinc-400">Multiple pictures supported</span>
          )}
        </div>

        {images.length === 0 ? (
          /* Empty / Initial Upload Prompt */
          <div
            onClick={() => multiFileInputRef.current?.click()}
            className="group p-5 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl hover:border-zinc-500 dark:hover:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-950/40 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                <Upload className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Insert pictures from device
                </p>
                <p className="text-[11px] text-zinc-400">
                  Select one or multiple screenshots to crop &amp; insert under OUTPUT:
                </p>
              </div>
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs shrink-0"
            >
              Browse Pictures
            </button>
          </div>
        ) : (
          /* List of Attached Images with Crop & Delete controls */
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {images.map((imgUri, idx) => (
                <div
                  key={idx}
                  className="p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/60 flex items-center justify-between gap-2.5 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-950 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUri}
                        alt={`Output Picture ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        Picture {idx + 1}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        2 lines space before &amp; after
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditExisting(idx)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors"
                      title="Free-form crop or rotate this picture"
                    >
                      <Crop className="w-3 h-3 text-blue-500" />
                      <span>Crop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200 dark:border-rose-900/50"
                      title="Remove picture"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Pictures Button */}
            <button
              type="button"
              onClick={() => multiFileInputRef.current?.click()}
              className="w-full py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/40 text-xs font-medium text-zinc-600 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-blue-500" />
              <span>Add Another Picture</span>
            </button>
          </div>
        )}
      </div>

      {/* Terminal / Text Output Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1 font-medium">
            <Terminal className="w-3.5 h-3.5 text-amber-500" />
            Console / Terminal Text Output (Optional if pictures attached)
          </span>
          <span className="text-[11px] text-zinc-400">Tab key indents</span>
        </div>

        <div className="relative rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden bg-zinc-950 text-zinc-100 shadow-inner">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={5}
            value={value}
            onChange={(e) => onChangeText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              images.length > 0
                ? 'Optional: Add any accompanying console text or notes...'
                : placeholder || 'Paste terminal output text...'
            }
            spellCheck={false}
            className="w-full px-4 py-3 font-mono text-sm bg-transparent text-zinc-100 outline-none resize-y placeholder:text-zinc-600 leading-relaxed"
          />
        </div>
      </div>

      {/* Free-form Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        initialImageSrc={newImageToCrop}
        onClose={() => {
          setIsCropModalOpen(false);
          setEditingImageIndex(null);
          setNewImageToCrop(null);
        }}
        onSaveCroppedImage={handleSaveCropped}
      />
    </div>
  );
};
