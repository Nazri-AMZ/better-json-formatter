export interface ExtractedJSON {
  id: string;
  originalText: string;
  recoveredText?: string;
  parsedData: any;
  isValid: boolean;
  warnings: string[];
  startIndex: number;
  endIndex: number;
}

export interface TabularRow {
  path: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  size?: number;
}

export interface ValidationResult {
  data: any;
  isValid: boolean;
  warnings: string[];
  recoveredText?: string;
}

export interface JSONProcessingState {
  jsonObjects: ExtractedJSON[];
  isProcessing: boolean;
  error: string | null;
  inputText: string;
}

export interface ViewMode {
  type: 'beautified' | 'tabular';
}

export interface ExportFormat {
  type: 'json' | 'csv' | 'clipboard';
}