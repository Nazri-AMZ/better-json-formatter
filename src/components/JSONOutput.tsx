'use client';

import { ExtractedJSON, MOLILogType } from '@/types/json';
import { CheckCircle, AlertTriangle, XCircle, Search, Filter, Activity, Clock, Server, User } from 'lucide-react';
import BeautifiedJSON from '@/components/BeautifiedJSON';
import TabularJSON from '@/components/TabularJSON';

interface JSONOutputProps {
  jsonObjects: ExtractedJSON[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: 'all' | 'valid' | 'invalid';
  onFilterChange: (type: 'all' | 'valid' | 'invalid') => void;
  moliMode: boolean;
}

export default function JSONOutput({
  jsonObjects,
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  moliMode
}: JSONOutputProps) {
  // Filter JSON objects based on selected filter
  const filteredObjects = jsonObjects.filter(obj => {
    if (filterType === 'valid') return obj.isValid;
    if (filterType === 'invalid') return !obj.isValid;
    return true;
  });

  const validCount = jsonObjects.filter(obj => obj.isValid).length;
  const invalidCount = jsonObjects.length - validCount;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">
            Output {moliMode && <span className="text-blue-600">(MOLI Mode)</span>}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">{jsonObjects.length} JSON objects found</span>
            {validCount > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{validCount}</span>
              </div>
            )}
            {invalidCount > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>{invalidCount}</span>
              </div>
            )}
            {moliMode && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                MOLI Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search JSON objects..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value as 'all' | 'valid' | 'invalid')}
            className="text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All ({jsonObjects.length})</option>
            <option value="valid">Valid ({validCount})</option>
            <option value="invalid">Invalid ({invalidCount})</option>
          </select>
        </div>
      </div>

      {/* JSON Objects List */}
      <div className="flex-1 overflow-y-auto p-4">
        {jsonObjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <XCircle className="w-12 h-12 mb-3" />
            <h3 className="text-lg font-medium mb-1">No JSON objects found</h3>
            <p className="text-sm text-center max-w-md">
              Paste some JSON or log text in the input area and click "Process JSON" to see results here.
            </p>
          </div>
        ) : filteredObjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Filter className="w-12 h-12 mb-3" />
            <h3 className="text-lg font-medium mb-1">No results found</h3>
            <p className="text-sm text-center max-w-md">
              Try adjusting your search terms or filter settings.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredObjects.map((jsonObject, index) => (
              <JSONObjectCard
                key={jsonObject.id}
                jsonObject={jsonObject}
                index={jsonObjects.indexOf(jsonObject) + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// JSON Object Card Component
interface JSONObjectCardProps {
  jsonObject: ExtractedJSON;
  index: number;
  moliMode: boolean;
}

function JSONObjectCard({ jsonObject, index, moliMode }: JSONObjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusColor = () => {
    if (jsonObject.isValid) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = () => {
    if (jsonObject.isValid) return <CheckCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (jsonObject.isValid) return 'Valid';
    return 'Invalid';
  };

  const getMOLILogTypeIcon = () => {
    if (!jsonObject.moliMetadata) return null;

    switch (jsonObject.moliMetadata.logType) {
      case MOLILogType.REQUEST:
        return <Activity className="w-4 h-4" />;
      case MOLILogType.RESPONSE:
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getMOLILogTypeColor = () => {
    if (!jsonObject.moliMetadata) return 'text-gray-600 bg-gray-50 border-gray-200';

    switch (jsonObject.moliMetadata.logType) {
      case MOLILogType.REQUEST:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case MOLILogType.RESPONSE:
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getMOLILogTypeText = () => {
    if (!jsonObject.moliMetadata) return 'Unknown';

    switch (jsonObject.moliMetadata.logType) {
      case MOLILogType.REQUEST:
        return 'Request';
      case MOLILogType.RESPONSE:
        return 'Response';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <button
            className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <span className="font-medium text-gray-900">
            {moliMode ? 'MOLI Log' : 'JSON'} #{index}
          </span>

          {moliMode && jsonObject.moliMetadata && (
            <div className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getMOLILogTypeColor()}`}>
              {getMOLILogTypeIcon()}
              <span>{getMOLILogTypeText()}</span>
            </div>
          )}

          <div className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor()}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>

          {jsonObject.warnings.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full text-yellow-600 bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="w-3 h-3" />
              <span>{jsonObject.warnings.length} warnings</span>
            </div>
          )}

          {moliMode && jsonObject.moliMetadata?.isIncomplete && (
            <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full text-orange-600 bg-orange-50 border border-orange-200">
              <AlertTriangle className="w-3 h-3" />
              <span>Recovered</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Position: {jsonObject.startIndex}-{jsonObject.endIndex}</span>
          <span>•</span>
          <span>{jsonObject.originalText.length} chars</span>
        </div>
      </div>

      {/* MOLI Metadata */}
      {moliMode && jsonObject.moliMetadata && isExpanded && (
        <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
          <div className="text-xs font-medium text-blue-800 mb-2">MOLI Metadata:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {jsonObject.moliMetadata.service && (
              <div className="flex items-center gap-1 text-blue-700">
                <Server className="w-3 h-3" />
                <span className="font-medium">Service:</span>
                <span>{jsonObject.moliMetadata.service}</span>
              </div>
            )}
            {jsonObject.moliMetadata.controller && (
              <div className="flex items-center gap-1 text-blue-700">
                <User className="w-3 h-3" />
                <span className="font-medium">Controller:</span>
                <span>{jsonObject.moliMetadata.controller}</span>
              </div>
            )}
            {jsonObject.moliMetadata.timestamp && (
              <div className="flex items-center gap-1 text-blue-700">
                <Clock className="w-3 h-3" />
                <span className="font-medium">Time:</span>
                <span>{new Date(jsonObject.moliMetadata.timestamp).toLocaleTimeString()}</span>
              </div>
            )}
            {jsonObject.moliMetadata.traceId && (
              <div className="flex items-center gap-1 text-blue-700">
                <Activity className="w-3 h-3" />
                <span className="font-medium">Trace ID:</span>
                <span className="font-mono">{jsonObject.moliMetadata.traceId.substring(0, 8)}...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {jsonObject.warnings.length > 0 && isExpanded && (
        <div className="px-3 py-2 bg-yellow-50 border-b border-yellow-200">
          <div className="text-xs font-medium text-yellow-800 mb-1">Recovery Warnings:</div>
          <ul className="text-xs text-yellow-700 space-y-1">
            {jsonObject.warnings.map((warning, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span>•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          <JSONContentDisplay jsonObject={jsonObject} moliMode={moliMode} />
        </div>
      )}
    </div>
  );
}

// Import useState
import { useState } from 'react';

// Content Display Component
function JSONContentDisplay({ jsonObject }: { jsonObject: ExtractedJSON }) {
  const [viewMode, setViewMode] = useState<'beautified' | 'tabular'>('beautified');

  if (!jsonObject.parsedData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Failed to parse JSON</div>
        <div className="text-red-600 text-sm mt-1">
          Original text: {jsonObject.originalText.substring(0, 100)}...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* View Mode Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setViewMode('beautified')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'beautified'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Beautified
        </button>
        <button
          onClick={() => setViewMode('tabular')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'tabular'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Tabular View
        </button>
      </div>

      {/* Content */}
      {viewMode === 'beautified' ? (
        <BeautifiedJSONDisplay data={jsonObject.parsedData} />
      ) : (
        <TabularJSONDisplay data={jsonObject.parsedData} />
      )}
    </div>
  );
}

function BeautifiedJSONDisplay({ data }: { data: any }) {
  return <BeautifiedJSON data={data} />;
}

function TabularJSONDisplay({ data }: { data: any }) {
  return <TabularJSON data={data} />;
}