export interface ExtractedJSON {
  id: string;
  originalText: string;
  recoveredText?: string;
  parsedData: any;
  isValid: boolean;
  warnings: string[];
  startIndex: number;
  endIndex: number;
  moliMetadata?: MOLIMetadata;
}

export enum MOLILogType {
  REQUEST = 'request',
  RESPONSE = 'response',
  UNKNOWN = 'unknown'
}

export interface MOLIMetadata {
  logType: MOLILogType;
  service?: string;
  controller?: string;
  timestamp?: string;
  traceId?: string;
  isIncomplete: boolean;
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