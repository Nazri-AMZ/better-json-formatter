"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Copy, Download, Check } from "lucide-react";

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

export default function BeautifiedJSON({
  data,
  indent = 2,
  onCopy,
  onDownload,
}: BeautifiedJSONProps) {
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
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
  const indentSize = 2; // Keep for calculations

  // If the data is an object or array, delegate rendering to the specific node component
  const isComplex = typeof data === "object" && data !== null;
  const isArray = Array.isArray(data);

  if (isComplex) {
    if (isArray) {
      return (
        <ArrayNode
          data={data}
          keyName={keyName}
          isLast={isLast}
          indent={indent}
        />
      );
    } else {
      // Must check if data is NOT an array, because Array.isArray(data) returns true for array
      return (
        <ObjectNode
          data={data}
          keyName={keyName}
          isLast={isLast}
          indent={indent}
        />
      );
    }
  }

  // --- Render Primitive Value ---

  const getValueType = (value: any): string => {
    if (value === null) return "null";
    return typeof value;
  };

  const renderValue = () => {
    const type = getValueType(data);

    switch (type) {
      case "string":
        return <span className="text-green-400">"{data}"</span>;
      case "number":
        return <span className="text-blue-400">{String(data)}</span>; // Ensure number is rendered as string
      case "boolean":
        return <span className="text-yellow-400">{String(data)}</span>; // Ensure boolean is rendered as string
      case "null":
        return <span className="text-purple-400">null</span>;
      default:
        // Catches undefined, symbol, etc. which aren't typical JSON
        return <span className="text-gray-400">{String(data)}</span>;
    }
  };

  const renderKey = () => {
    if (keyName === undefined || keyName === null) return null;
    return (
      <>
        <span className="text-blue-300">"{keyName}"</span>
        <span className="text-gray-500">: </span>
      </>
    );
  };

  return (
    <div
      // Removed select-none to allow text selection
      className="inline-block w-full"
      style={{ paddingLeft: `${indent * indentSize * 0.6}rem` }}
    >
      {renderKey()}
      {renderValue()}
      {!isLast && <span className="text-gray-500">,</span>}
    </div>
  );
}

// Object Node Component
function ObjectNode({ data, keyName, isLast, indent }: JSONNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const entries = Object.entries(data);
  const hasEntries = entries.length > 0;
  const indentSize = 2; // For calculating closing brace indentation

  const renderKey = () => {
    if (keyName === undefined || keyName === null) return null;
    return (
      <>
        <span className="text-blue-300">"{keyName}"</span>
        <span className="text-gray-500">: </span>
      </>
    );
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div
      className="inline-block w-full"
      style={{ paddingLeft: `${indent * indentSize * 0.6}rem` }}
    >
      {renderKey()}
      <span
        className="text-gray-500 cursor-pointer hover:text-gray-400"
        onClick={toggleExpand}
      >
        {isExpanded ? (
          <ChevronDown className="inline w-3 h-3 mr-1" />
        ) : (
          <ChevronRight className="inline w-3 h-3 mr-1" />
        )}
        {"{"}
        {/* Shows count when collapsed */}
        {!isExpanded && hasEntries && (
          <span className="text-gray-400 ml-1">... {entries.length} items</span>
        )}
      </span>

      {isExpanded && hasEntries && (
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
          <span
            className="text-gray-500 block"
            style={{ paddingLeft: `${indent * indentSize * 0.6}rem` }}
          >
            {"}"}
          </span>
        </>
      )}

      {/* For empty object case */}
      {!hasEntries && <span className="text-gray-500">{"}"}</span>}

      {/* For collapsed object case */}
      {!isExpanded && hasEntries && (
        <span className="text-gray-500">{"}"}</span>
      )}

      {!isLast && <span className="text-gray-500">,</span>}
    </div>
  );
}

// Array Node Component
function ArrayNode({ data, keyName, isLast, indent }: JSONNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasItems = data.length > 0;
  const indentSize = 2;

  const renderKey = () => {
    if (keyName === undefined || keyName === null) return null;
    return (
      <>
        <span className="text-blue-300">"{keyName}"</span>
        <span className="text-gray-500">: </span>
      </>
    );
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div
      className="inline-block w-full"
      style={{ paddingLeft: `${indent * indentSize * 0.6}rem` }}
    >
      {renderKey()}
      <span
        className="text-gray-500 cursor-pointer hover:text-gray-400"
        onClick={toggleExpand}
      >
        {isExpanded ? (
          <ChevronDown className="inline w-3 h-3 mr-1" />
        ) : (
          <ChevronRight className="inline w-3 h-3 mr-1" />
        )}
        {"["}
        {/* Shows count when collapsed */}
        {!isExpanded && hasItems && (
          <span className="text-gray-400 ml-1">... {data.length} items</span>
        )}
      </span>

      {isExpanded && hasItems && (
        <>
          <div>
            {/* Array items do not have a keyName, so we pass null */}
            {data.map((item: any, index: number) => (
              <JSONNode
                key={index}
                data={item}
                isLast={index === data.length - 1}
                indent={indent + 1}
              />
            ))}
          </div>
          <span
            className="text-gray-500 block"
            style={{ paddingLeft: `${indent * indentSize * 0.6}rem` }}
          >
            {"]"}
          </span>
        </>
      )}

      {/* For empty array case */}
      {!hasItems && <span className="text-gray-500">{"]"}</span>}

      {/* For collapsed array case */}
      {!isExpanded && hasItems && <span className="text-gray-500">{"]"}</span>}

      {!isLast && <span className="text-gray-500">,</span>}
    </div>
  );
}
