'use client';

import { useState } from 'react';
import { useJSONProcessor } from '@/hooks/useJSONProcessor';
import JSONInput from '@/components/JSONInput';
import JSONOutput from '@/components/JSONOutput';
import { Sparkles, Code, FileJson, Github } from 'lucide-react';

export default function Home() {
  const {
    inputText,
    jsonObjects,
    isProcessing,
    error,
    moliMode,
    setMoliMode,
    processJSON,
    setInputText
  } = useJSONProcessor();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'valid' | 'invalid'>('all');

  const handleProcess = () => {
    processJSON(inputText);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <FileJson className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  JSON Beautifier & Displayer
                </h1>
                <p className="text-sm text-gray-500">
                  Extract, beautify, and analyze JSON from any text
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* MOLI Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">MOLI Mode</span>
                <button
                  onClick={() => setMoliMode(!moliMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    moliMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      moliMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">Processing Error</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Side-by-side Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Input Section */}
          <div className="flex flex-col min-h-0">
            <JSONInput
              value={inputText}
              onChange={setInputText}
              onProcess={handleProcess}
              isProcessing={isProcessing}
              moliMode={moliMode}
            />
          </div>

          {/* Output Section */}
          <div className="flex flex-col min-h-0">
            <JSONOutput
              jsonObjects={jsonObjects}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterType={filterType}
              onFilterChange={setFilterType}
              moliMode={moliMode}
            />
          </div>
        </div>

        {/* Quick Examples */}
        {jsonObjects.length === 0 && !inputText && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Quick Examples</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ExampleCard
                title="Simple JSON"
                description="Basic object with different data types"
                example={`{\n  "name": "John Doe",\n  "age": 30,\n  "active": true,\n  "tags": ["dev", "js"]\n}`}
                onExampleSelect={setInputText}
              />

              <ExampleCard
                title="Malformed JSON"
                description="JSON with formatting errors (will be recovered)"
                example={`{\n  "id": 123\n  "title": "Sample",\n  "data": [1, 2, 3,],\n  "status": "active"\n}`}
                onExampleSelect={setInputText}
              />

              <ExampleCard
                title="JSON in Logs"
                description="Multiple JSON objects embedded in log text"
                example={`[2024-01-01] Request: {"action": "login", "user": "john"}
[2024-01-01] Response: {"status": "success", "token": "abc123"}`}
                onExampleSelect={setInputText}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Example Card Component
interface ExampleCardProps {
  title: string;
  description: string;
  example: string;
  onExampleSelect: (example: string) => void;
}

function ExampleCard({ title, description, example, onExampleSelect }: ExampleCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
         onClick={() => onExampleSelect(example)}>
      <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
        {example}
      </pre>
      <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
        Try this example →
      </button>
    </div>
  );
}