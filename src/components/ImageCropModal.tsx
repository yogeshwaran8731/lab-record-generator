'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  RotateCw,
  Crop as CropIcon,
  Check,
  Sun,
  Maximize2,
  RefreshCw,
  Upload,
} from 'lucide-react';

interface CropBox {
  x: number; // percentage (0 to 100)
  y: number;
  w: number;
  h: number;
}

interface ImageCropModalProps {
  isOpen: boolean;
  initialImageSrc?: string | null;
  onClose: () => void;
  onSaveCroppedImage: (croppedDataUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  initialImageSrc,
  onClose,
  onSaveCroppedImage,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageSrc || null);
  const [rotation, setRotation] = useState<number>(0);
  const [invert, setInvert] = useState<boolean>(false);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 5, y: 5, w: 90, h: 90 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; box: CropBox } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialImageSrc when modal opens
  useEffect(() => {
    if (isOpen && initialImageSrc) {
      setImageSrc(initialImageSrc);
      setRotation(0);
      setInvert(false);
      setCropBox({ x: 5, y: 5, w: 90, h: 90 });
    }
  }, [isOpen, initialImageSrc]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null);
        setRotation(0);
        setCropBox({ x: 5, y: 5, w: 90, h: 90 });
      });
      reader.readAsDataURL(file);
    }
  };

  // Start dragging a handle or the box
  const handlePointerDown = (handle: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveHandle(handle);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      box: { ...cropBox },
    });
  };

  // Move handle or box
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!activeHandle || !dragStart || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Delta as percentage of container
      const deltaX = ((e.clientX - dragStart.mouseX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.mouseY) / rect.height) * 100;

      const start = dragStart.box;
      const minSize = 5; // minimum 5%

      let next = { ...start };

      switch (activeHandle) {
        case 'move': {
          const newX = Math.max(0, Math.min(100 - start.w, start.x + deltaX));
          const newY = Math.max(0, Math.min(100 - start.h, start.y + deltaY));
          next = { ...next, x: newX, y: newY };
          break;
        }
        case 'nw': {
          const newX = Math.max(0, Math.min(start.x + start.w - minSize, start.x + deltaX));
          const newY = Math.max(0, Math.min(start.y + start.h - minSize, start.y + deltaY));
          next = {
            x: newX,
            y: newY,
            w: start.w - (newX - start.x),
            h: start.h - (newY - start.y),
          };
          break;
        }
        case 'ne': {
          const newY = Math.max(0, Math.min(start.y + start.h - minSize, start.y + deltaY));
          const newW = Math.max(minSize, Math.min(100 - start.x, start.w + deltaX));
          next = {
            ...next,
            y: newY,
            w: newW,
            h: start.h - (newY - start.y),
          };
          break;
        }
        case 'se': {
          const newW = Math.max(minSize, Math.min(100 - start.x, start.w + deltaX));
          const newH = Math.max(minSize, Math.min(100 - start.y, start.h + deltaY));
          next = { ...next, w: newW, h: newH };
          break;
        }
        case 'sw': {
          const newX = Math.max(0, Math.min(start.x + start.w - minSize, start.x + deltaX));
          const newH = Math.max(minSize, Math.min(100 - start.y, start.h + deltaY));
          next = {
            x: newX,
            y: start.y,
            w: start.w - (newX - start.x),
            h: newH,
          };
          break;
        }
        case 'n': {
          const newY = Math.max(0, Math.min(start.y + start.h - minSize, start.y + deltaY));
          next = {
            ...next,
            y: newY,
            h: start.h - (newY - start.y),
          };
          break;
        }
        case 's': {
          const newH = Math.max(minSize, Math.min(100 - start.y, start.h + deltaY));
          next = { ...next, h: newH };
          break;
        }
        case 'w': {
          const newX = Math.max(0, Math.min(start.x + start.w - minSize, start.x + deltaX));
          next = {
            ...next,
            x: newX,
            w: start.w - (newX - start.x),
          };
          break;
        }
        case 'e': {
          const newW = Math.max(minSize, Math.min(100 - start.x, start.w + deltaX));
          next = { ...next, w: newW };
          break;
        }
      }

      setCropBox(next);
    },
    [activeHandle, dragStart]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveHandle(null);
      setDragStart(null);
    }
  };

  // Preset ratios or full reset
  const applyPreset = (type: 'full' | '16:9' | '4:3' | '1:1') => {
    if (type === 'full') {
      setCropBox({ x: 0, y: 0, w: 100, h: 100 });
      return;
    }
    let ratio = 1;
    if (type === '16:9') ratio = 16 / 9;
    if (type === '4:3') ratio = 4 / 3;
    if (type === '1:1') ratio = 1;

    // Calculate box centered with target ratio based on container aspect
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const currentRatio = width / height;
      if (ratio > currentRatio) {
        const w = 90;
        const h = (w * currentRatio) / ratio;
        setCropBox({
          x: 5,
          y: (100 - h) / 2,
          w,
          h,
        });
      } else {
        const h = 90;
        const w = (h * ratio) / currentRatio;
        setCropBox({
          x: (100 - w) / 2,
          y: 5,
          w,
          h,
        });
      }
    }
  };

  // Perform actual crop & export
  const handleApplyCrop = async () => {
    if (!imageSrc) return;

    try {
      setIsProcessing(true);

      // Load image into an Image object
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      // 1. Handle rotation onto a primary canvas
      const rotRad = ((rotation % 360) * Math.PI) / 180;
      const is90or270 = (rotation % 180) !== 0;
      const rotatedWidth = is90or270 ? img.height : img.width;
      const rotatedHeight = is90or270 ? img.width : img.height;

      const rotCanvas = document.createElement('canvas');
      rotCanvas.width = rotatedWidth;
      rotCanvas.height = rotatedHeight;
      const rotCtx = rotCanvas.getContext('2d');
      if (!rotCtx) throw new Error('Rotated canvas 2D context unavailable');

      // Center and rotate
      rotCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
      rotCtx.rotate(rotRad);
      rotCtx.drawImage(img, -img.width / 2, -img.height / 2);

      // 2. Compute pixel crop coordinates
      const cropX = Math.round((cropBox.x / 100) * rotatedWidth);
      const cropY = Math.round((cropBox.y / 100) * rotatedHeight);
      const cropW = Math.max(1, Math.round((cropBox.w / 100) * rotatedWidth));
      const cropH = Math.max(1, Math.round((cropBox.h / 100) * rotatedHeight));

      // 3. Draw cropped area onto final canvas
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = cropW;
      finalCanvas.height = cropH;
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) throw new Error('Final canvas context unavailable');

      // Apply invert filter if enabled
      if (invert) {
        finalCtx.filter = 'invert(100%)';
      }

      finalCtx.drawImage(
        rotCanvas,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        cropW,
        cropH
      );

      const resultDataUrl = finalCanvas.toDataURL('image/png');
      onSaveCroppedImage(resultDataUrl);
      onClose();
    } catch (err) {
      console.error('Error cropping image:', err);
      alert('Could not process image crop. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <CropIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                Free-form Crop &amp; Edit Picture
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Drag any corner or edge freely to select the exact output region
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
          {!imageSrc ? (
            /* Upload State */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors bg-zinc-50/50 dark:bg-zinc-950/50 min-h-[300px]"
            >
              <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Select an output picture or screenshot
                </p>
                <p className="text-xs text-zinc-400">
                  PNG, JPG, WEBP from your device
                </p>
              </div>
              <button
                type="button"
                className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
              >
                Browse Device
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            /* Interactive Free-form Cropper */
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Cropper Viewport Container */}
              <div className="relative w-full h-[320px] sm:h-[380px] bg-zinc-950 rounded-xl overflow-hidden shadow-inner border border-zinc-800 flex items-center justify-center p-2 select-none">
                <div
                  ref={containerRef}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="relative inline-block max-w-full max-h-full cursor-crosshair touch-none select-none"
                >
                  {/* Base Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Source to crop"
                    draggable={false}
                    className="max-h-[300px] sm:max-h-[360px] max-w-full object-contain pointer-events-none rounded select-none"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      filter: invert ? 'invert(100%)' : 'none',
                    }}
                  />

                  {/* Shaded Backdrop Outside Crop Box */}
                  <div
                    className="absolute inset-0 bg-black/60 pointer-events-none"
                    style={{
                      clipPath: `polygon(
                        0% 0%, 100% 0%, 100% 100%, 0% 100%,
                        0% ${cropBox.y}%,
                        ${cropBox.x}% ${cropBox.y}%,
                        ${cropBox.x}% ${cropBox.y + cropBox.h}%,
                        ${cropBox.x + cropBox.w}% ${cropBox.y + cropBox.h}%,
                        ${cropBox.x + cropBox.w}% ${cropBox.y}%,
                        0% ${cropBox.y}%
                      )`,
                    }}
                  />

                  {/* Free-form Crop Box */}
                  <div
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.w}%`,
                      height: `${cropBox.h}%`,
                    }}
                    onPointerDown={(e) => handlePointerDown('move', e)}
                    className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.8)] cursor-move select-none"
                  >
                    {/* Grid lines (Rule of thirds) */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-white" />
                      <div className="border-r border-white" />
                      <div />
                    </div>

                    {/* Corner Handles (Large, easy to grab) */}
                    {/* NW */}
                    <div
                      onPointerDown={(e) => handlePointerDown('nw', e)}
                      className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-zinc-900 rounded-xs shadow-md cursor-nwse-resize z-20"
                    />
                    {/* NE */}
                    <div
                      onPointerDown={(e) => handlePointerDown('ne', e)}
                      className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-zinc-900 rounded-xs shadow-md cursor-nesw-resize z-20"
                    />
                    {/* SE */}
                    <div
                      onPointerDown={(e) => handlePointerDown('se', e)}
                      className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-zinc-900 rounded-xs shadow-md cursor-nwse-resize z-20"
                    />
                    {/* SW */}
                    <div
                      onPointerDown={(e) => handlePointerDown('sw', e)}
                      className="absolute -bottom-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-zinc-900 rounded-xs shadow-md cursor-nesw-resize z-20"
                    />

                    {/* Side Edge Handles */}
                    {/* N */}
                    <div
                      onPointerDown={(e) => handlePointerDown('n', e)}
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border border-zinc-900 rounded-xs cursor-ns-resize z-10"
                    />
                    {/* S */}
                    <div
                      onPointerDown={(e) => handlePointerDown('s', e)}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border border-zinc-900 rounded-xs cursor-ns-resize z-10"
                    />
                    {/* W */}
                    <div
                      onPointerDown={(e) => handlePointerDown('w', e)}
                      className="absolute top-1/2 -translate-y-1/2 -left-2 w-3 h-6 bg-white border border-zinc-900 rounded-xs cursor-ew-resize z-10"
                    />
                    {/* E */}
                    <div
                      onPointerDown={(e) => handlePointerDown('e', e)}
                      className="absolute top-1/2 -translate-y-1/2 -right-2 w-3 h-6 bg-white border border-zinc-900 rounded-xs cursor-ew-resize z-10"
                    />
                  </div>
                </div>
              </div>

              {/* Editing & Crop Toolbar */}
              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-950/70 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-zinc-500 mr-1">Crop Mode:</span>
                    <button
                      type="button"
                      onClick={() => applyPreset('full')}
                      className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                      title="Select the entire picture"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Full Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('16:9')}
                      className="px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                    >
                      16:9
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('4:3')}
                      className="px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                    >
                      4:3
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('1:1')}
                      className="px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                    >
                      1:1
                    </button>
                  </div>

                  {/* Rotate, Invert & Replace */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                      title="Rotate 90 degrees clockwise"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Rotate 90°</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInvert(!invert)}
                      className={`flex items-center gap-1 px-2.5 py-1 border rounded-md font-medium transition-colors ${
                        invert
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                      title="Invert dark terminal to white background"
                    >
                      <Sun className="w-3 h-3" />
                      <span>Invert B/W</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                      title="Choose a different image file"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Replace</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400">
                  Tip: Drag any white corner or edge handle to resize the crop box freely in any direction.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
          {imageSrc && (
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isProcessing ? 'Processing...' : 'Done — Insert Picture'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
