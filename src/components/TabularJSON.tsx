'use client';

import { useState, useMemo } from 'react';
import { TabularRow } from '@/types/json';
import { JSONProcessor } from '@/lib/jsonProcessor';
import { Copy, Download, Search, ArrowUpDown, Check } from 'lucide-react';

interface TabularJSONProps {
  data: any;
  onCopy?: () => void;
  onDownload?: () => void;
}

type SortField = 'path' | 'value' | 'type';
type SortDirection = 'asc' | 'desc';

export default function TabularJSON({ data, onCopy, onDownload }: TabularJSONProps) {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('path');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const processor = useMemo(() => new JSONProcessor(), []);

  // Generate tabular data
  const tabularData = useMemo(() => {
    return processor.generateTabularData(data);
  }, [data, processor]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = processor.searchTabularData(tabularData, searchTerm);

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return filtered;
  }, [tabularData, searchTerm, sortField, sortDirection, processor]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCopyTable = async () => {
    const csvData = processor.exportToCSV(filteredData);
    try {
      await navigator.clipboard.writeText(csvData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (error) {
      // Fallback
    }
  };

  const handleDownloadCSV = () => {
    const csvData = processor.exportToCSV(filteredData);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `json-table-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string':
        return 'text-green-600 bg-green-50';
      case 'number':
        return 'text-blue-600 bg-blue-50';
      case 'boolean':
        return 'text-yellow-600 bg-yellow-50';
      case 'object':
        return 'text-purple-600 bg-purple-50';
      case 'array':
        return 'text-indigo-600 bg-indigo-50';
      case 'null':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatValue = (value: any, type: string) => {
    if (type === 'string') {
      return value.length > 50 ? `${value.substring(0, 47)}...` : value;
    }
    if (type === 'object' || type === 'array') {
      return value;
    }
    return value;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search paths, values, or types..."
              className="w-64 pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-600"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredData.length} of {tabularData.length} items
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopyTable}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Copy as CSV"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-gray-700" />
                Copy CSV
              </>
            )}
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Download as CSV"
          >
            <Download className="w-3 h-3 text-gray-700" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('path')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
                >
                  Path
                  <ArrowUpDown className="w-3 h-3" />
                  {sortField === 'path' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('value')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
                >
                  Value
                  <ArrowUpDown className="w-3 h-3" />
                  {sortField === 'value' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
                >
                  Type
                  <ArrowUpDown className="w-3 h-3" />
                  {sortField === 'type' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                Size
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-900">
                  {row.path}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate" title={row.value}>
                  {formatValue(row.value, row.type)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(row.type)}`}>
                    {row.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {row.size !== undefined ? row.size : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">
              {searchTerm ? 'No items match your search criteria.' : 'No data available.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>
            Showing {filteredData.length} of {tabularData.length} items
          </span>
          <div className="flex items-center gap-4">
            <span>
              {tabularData.filter(row => row.type === 'string').length} strings,
              {' '}{tabularData.filter(row => row.type === 'number').length} numbers,
              {' '}{tabularData.filter(row => row.type === 'boolean').length} booleans,
              {' '}{tabularData.filter(row => row.type === 'object').length} objects,
              {' '}{tabularData.filter(row => row.type === 'array').length} arrays
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}