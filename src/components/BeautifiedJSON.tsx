'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Download, Check } from 'lucide-react';

interface BeautifiedJSONProps {
  data: any;
  indent?: number;
  onCopy?: () => void;
  onDownload?: () => void;
}

interface JSONNodeProps {
  data: any;
  keyName?: string;
  isLast: boolean;
  indent: number;
}

export default function BeautifiedJSON({ data, indent = 2, onCopy, onDownload }: BeautifiedJSONProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const jsonString = JSON.stringify(data, null, indent);
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (error) {
      // Fallback
    }
  };

  const handleDownload = () => {
    const jsonString = JSON.stringify(data, null, indent);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `json-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  return (
    <div className="relative">
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-gray-700" />
              Copy
            </>
          )}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Download as JSON file"
        >
          <Download className="w-3 h-3 text-gray-700" />
          Download
        </button>
      </div>

      {/* JSON Display */}
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
        <JSONNode data={data} indent={0} isLast={true} />
      </div>
    </div>
  );
}

// JSON Node Component with syntax highlighting and expand/collapse
function JSONNode({ data, keyName, isLast, indent }: JSONNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const indentSize = 2;

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const renderValue = () => {
    const type = getValueType(data);

    switch (type) {
      case 'string':
        return <span className="text-green-400">"{data}"</span>;
      case 'number':
        return <span className="text-blue-400">{data}</span>;
      case 'boolean':
        return <span className="text-yellow-400">{data}</span>;
      case 'null':
        return <span className="text-purple-400">null</span>;
      case 'object':
        if (Array.isArray(data)) {
          return (
            <ArrayNode
              data={data}
              keyName={keyName}
              isLast={isLast}
              indent={indent}
            />
          );
        } else {
          return (
            <ObjectNode
              data={data}
              keyName={keyName}
              isLast={isLast}
              indent={indent}
            />
          );
        }
      default:
        return <span className="text-gray-400">{String(data)}</span>;
    }
  };

  const renderKey = () => {
    if (keyName === undefined) return null;
    return (
      <>
        <span className="text-blue-300">"{keyName}"</span>
        <span className="text-gray-500">: </span>
      </>
    );
  };

  return (
    <div className="select-none">
      <span style={{ paddingLeft: `${indent * indentSize * 0.6}rem` }}>
        {renderKey()}
        {renderValue()}
        {!isLast && <span className="text-gray-500">,</span>}
      </span>
    </div>
  );
}

// Object Node Component
function ObjectNode({ data, keyName, isLast, indent }: JSONNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const entries = Object.entries(data);
  const hasEntries = entries.length > 0;

  if (!hasEntries) {
    return (
      <span>
        <span className="text-gray-500">{'{'}</span>
        <span className="text-gray-500">{'}'}</span>
      </span>
    );
  }

  return (
    <span>
      <span
        className="text-gray-500 cursor-pointer hover:text-gray-400"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown className="inline w-3 h-3" /> : <ChevronRight className="inline w-3 h-3" />}
        {'{'}
      </span>

      {isExpanded && (
        <>
          <div>
            {entries.map(([key, value], index) => (
              <JSONNode
                key={key}
                data={value}
                keyName={key}
                isLast={index === entries.length - 1}
                indent={indent + 1}
              />
            ))}
          </div>
          <span style={{ paddingLeft: `${(indent + 0.5) * 1.2}rem` }}>
            <span className="text-gray-500">{'}'}</span>
          </span>
        </>
      )}

      {!isExpanded && (
        <span className="text-gray-400">
          {' ... '}
          <span className="text-gray-500">{'}'}</span>
        </span>
      )}

      {!isLast && <span className="text-gray-500">,</span>}
    </span>
  );
}

// Array Node Component
function ArrayNode({ data, keyName, isLast, indent }: JSONNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasItems = data.length > 0;

  if (!hasItems) {
    return (
      <span>
        <span className="text-gray-500">[</span>
        <span className="text-gray-500">]</span>
      </span>
    );
  }

  return (
    <span>
      <span
        className="text-gray-500 cursor-pointer hover:text-gray-400"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown className="inline w-3 h-3" /> : <ChevronRight className="inline w-3 h-3" />}
        {'['}
      </span>

      {isExpanded && (
        <>
          <div>
            {data.map((item: any, index: number) => (
              <JSONNode
                key={index}
                data={item}
                isLast={index === data.length - 1}
                indent={indent + 1}
              />
            ))}
          </div>
          <span style={{ paddingLeft: `${(indent + 0.5) * 1.2}rem` }}>
            <span className="text-gray-500">{']'}</span>
          </span>
        </>
      )}

      {!isExpanded && (
        <HoverCopyButton value={data} className="inline-block">
          <span className="text-gray-400">
            {' ... '}
            <span className="text-gray-500">{']'}</span>
          </span>
        </HoverCopyButton>
      )}

      {!isLast && <span className="text-gray-500">,</span>}
    </span>
  );
}