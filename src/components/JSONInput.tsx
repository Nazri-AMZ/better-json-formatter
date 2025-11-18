'use client';

import { useState } from 'react';
import { Loader2, FileText, Zap } from 'lucide-react';

interface JSONInputProps {
  value: string;
  onChange: (value: string) => void;
  onProcess: () => void;
  isProcessing: boolean;
  moliMode: boolean;
  placeholder?: string;
}

export default function JSONInput({
  value,
  onChange,
  onProcess,
  isProcessing,
  moliMode,
  placeholder = moliMode ? "Paste MOLI request/response logs here..." : "Paste your JSON or request/response logs here... Multiple JSON objects are supported, even if embedded in text."
}: JSONInputProps) {
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(1);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCharCount(newValue.length);
    setLineCount(newValue.split('\n').length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onProcess();
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(value + text);
    } catch (error) {
      // Fallback to manual paste
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">
            Input {moliMode && <span className="text-blue-600">(MOLI Mode)</span>}
          </h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{lineCount} lines</span>
          <span>{charCount.toLocaleString()} chars</span>
          {moliMode && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              MOLI Active
            </span>
          )}
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-4 min-h-0">
        <textarea
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-full p-4 font-mono text-sm bg-gray-50 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-600"
        />
      </div>

      {/* Footer with controls */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePaste}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FileText className="w-4 h-4" />
            Paste
          </button>
        </div>

        <div className="flex items-center gap-3">
          {value && (
            <button
              onClick={() => onChange('')}
              disabled={isProcessing}
              className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear
            </button>
          )}

          <button
            onClick={onProcess}
            disabled={isProcessing || !value.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Process JSON
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="px-4 pb-4 text-xs text-gray-600 flex-shrink-0">
        <p>
          {moliMode ? (
            <>
              <strong className="text-gray-900">MOLI Tips:</strong> Press Ctrl+Enter to process • Each log entry will be processed separately •
              Recovers incomplete JSON objects • Handles mixed content with text separators
            </>
          ) : (
            <>
              <strong className="text-gray-900">Tips:</strong> Press Ctrl+Enter to process • Supports multiple JSON objects •
              Recovers from common formatting errors • Handles JSON embedded in logs
            </>
          )}
        </p>
      </div>
    </div>
  );
}