'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExtractedJSON } from '@/types/json';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Copy,
  Download,
  Check,
  Monitor,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import BeautifiedJSON from '@/components/BeautifiedJSON';
import TabularJSON from '@/components/TabularJSON';

interface FullscreenJSONPopupProps {
  jsonObject: ExtractedJSON | null;
  allObjects: ExtractedJSON[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  moliMode: boolean;
}

export default function FullscreenJSONPopup({
  jsonObject,
  allObjects,
  currentIndex,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  moliMode
}: FullscreenJSONPopupProps) {
  const [viewMode, setViewMode] = useState<'beautified' | 'tabular'>('beautified');
  const [copied, setCopied] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            onPrevious();
          }
          break;
        case 'ArrowRight':
          if (currentIndex < allObjects.length - 1) {
            onNext();
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (currentIndex > 0) {
            onPrevious();
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (currentIndex < allObjects.length - 1) {
            onNext();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, allObjects.length, onClose, onPrevious, onNext]);

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCopy = useCallback(async () => {
    if (!jsonObject?.parsedData) return;

    try {
      const jsonString = JSON.stringify(jsonObject.parsedData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [jsonObject]);

  const handleDownload = useCallback(() => {
    if (!jsonObject?.parsedData) return;

    const jsonString = JSON.stringify(jsonObject.parsedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `json-${jsonObject.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [jsonObject]);

  if (!isOpen || !jsonObject) return null;

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < allObjects.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      {/* Popup Container */}
      <div className="flex flex-col w-full h-full max-w-7xl max-h-[95vh] m-4 bg-white rounded-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Monitor className="w-4 h-4" />
              <span className="font-medium">Fullscreen Mode</span>
            </div>
            <div className="text-sm text-gray-900">
              {moliMode ? 'MOLI Log' : 'JSON'} #{currentIndex + 1} of {allObjects.length}
            </div>
            {jsonObject.isValid && (
              <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full text-green-600 bg-green-50 border border-green-200">
                <Check className="w-3 h-3" />
                Valid
              </div>
            )}
            {jsonObject.warnings.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full text-yellow-600 bg-yellow-50 border border-yellow-200">
                {jsonObject.warnings.length} warnings
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-700" />
                  Copy
                </>
              )}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
              title="Download as JSON file"
            >
              <Download className="w-4 h-4 text-gray-700" />
              Download
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              title="Close (ESC)"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-4 p-3 bg-gray-100 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              canGoPrevious
                ? 'text-gray-900 bg-white hover:bg-gray-50 border border-gray-300'
                : 'text-gray-400 bg-gray-200 border border-gray-300 cursor-not-allowed'
            }`}
            title="Previous (Arrow Left)"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Object</span>
            <span className="text-sm font-medium text-gray-900">
              {currentIndex + 1} / {allObjects.length}
            </span>
          </div>

          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              canGoNext
                ? 'text-gray-900 bg-white hover:bg-gray-50 border border-gray-300'
                : 'text-gray-400 bg-gray-200 border border-gray-300 cursor-not-allowed'
            }`}
            title="Next (Arrow Right)"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={() => setViewMode('beautified')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'beautified'
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Beautified View
          </button>
          <button
            onClick={() => setViewMode('tabular')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'tabular'
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Tabular View
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6 bg-gray-50">
          {jsonObject.parsedData ? (
            <div className="w-full h-full">
              {viewMode === 'beautified' ? (
                <div className="w-full h-full bg-gray-900 rounded-lg p-6 overflow-auto">
                  <BeautifiedJSON data={jsonObject.parsedData} />
                </div>
              ) : (
                <div className="w-full h-full bg-white rounded-lg border border-gray-200 overflow-auto">
                  <TabularJSON data={jsonObject.parsedData} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                <div className="text-red-800 font-medium mb-2">
                  {jsonObject.isValid
                    ? "Failed to process recovered JSON"
                    : "Failed to parse JSON"}
                </div>
                <div className="text-red-600 text-sm">
                  Original text: {jsonObject.originalText.substring(0, 100)}...
                </div>
                {jsonObject.warnings.length > 0 && (
                  <div className="mt-4">
                    <div className="text-red-700 text-xs font-medium mb-2">
                      Recovery attempts made:
                    </div>
                    <ul className="text-red-600 text-xs space-y-1">
                      {jsonObject.warnings.map((warning, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span>•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            Position: {jsonObject.startIndex}-{jsonObject.endIndex} • {jsonObject.originalText.length} characters
          </div>
          <div className="text-xs text-gray-500">
            Press ESC to close • Arrow keys to navigate
          </div>
        </div>
      </div>
    </div>
  );
}