'use client';

import { useState, useCallback } from 'react';
import { ExtractedJSON, JSONProcessingState } from '@/types/json';
import { JSONProcessor } from '@/lib/jsonProcessor';

export function useJSONProcessor() {
  const [state, setState] = useState<JSONProcessingState>({
    jsonObjects: [],
    isProcessing: false,
    error: null,
    inputText: ''
  });
  const [moliMode, setMoliMode] = useState(false);

  const processor = new JSONProcessor();

  const processJSON = useCallback(async (inputText: string) => {
    if (!inputText.trim()) {
      setState(prev => ({
        ...prev,
        jsonObjects: [],
        error: 'Please enter some text to process',
        isProcessing: false
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null
    }));

    try {
      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const jsonObjects = processor.extractJSONObjects(inputText);

      if (jsonObjects.length === 0) {
        setState(prev => ({
          ...prev,
          jsonObjects: [],
          error: 'No JSON objects found in the input text',
          isProcessing: false
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        jsonObjects,
        isProcessing: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isProcessing: false
      }));
    }
  }, [processor]);

  const setInputText = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      inputText: text
    }));
  }, []);

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      jsonObjects: [],
      error: null
    }));
  }, []);

  const exportAllAsJSON = useCallback(() => {
    const validObjects = state.jsonObjects.filter(obj => obj.isValid);
    const data = validObjects.map(obj => obj.parsedData);
    return JSON.stringify(data, null, 2);
  }, [state.jsonObjects]);

  const exportAllAsCSV = useCallback(() => {
    const allTabularData: any[] = [];

    state.jsonObjects.forEach((jsonObj, index) => {
      const processor = new JSONProcessor();
      const tabularData = processor.generateTabularData(jsonObj.parsedData);

      tabularData.forEach(row => {
        allTabularData.push({
          jsonObject: index + 1,
          ...row
        });
      });
    });

    const headers = ['JSON Object', 'Path', 'Value', 'Type', 'Size'];
    const csvRows = [headers.join(',')];

    allTabularData.forEach(row => {
      const value = String(row.value).replace(/"/g, '""');
      csvRows.push(`${row.jsonObject},"${row.path}","${value}","${row.type}",${row.size || ''}`);
    });

    return csvRows.join('\n');
  }, [state.jsonObjects]);

  return {
    ...state,
    processJSON,
    setInputText,
    clearResults,
    exportAllAsJSON,
    exportAllAsCSV,
    processor
  };
}