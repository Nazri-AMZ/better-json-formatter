import { ExtractedJSON, TabularRow, ValidationResult, MOLIMetadata, MOLILogType } from '@/types/json';

export class JSONProcessor {

  /**
   * Extract all JSON objects from text input
   */
  extractJSONObjects(text: string, moliMode: boolean = false): ExtractedJSON[] {
    const jsonObjects: ExtractedJSON[] = [];

    if (moliMode) {
      return this.extractMOLILogs(text);
    }

    // Pattern to find JSON objects and arrays in text
    const jsonPatterns = [
      /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,
      /\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]/g
    ];

    jsonPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const jsonText = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + jsonText.length;

        const validationResult = this.validateAndRecoverJSON(jsonText);

        jsonObjects.push({
          id: `json-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          originalText: jsonText,
          recoveredText: validationResult.recoveredText,
          parsedData: validationResult.data,
          isValid: validationResult.isValid,
          warnings: validationResult.warnings,
          startIndex,
          endIndex
        });
      }
    });

    // Remove duplicates (same start/end positions)
    const uniqueJSONs = jsonObjects.filter((obj, index, arr) =>
      index === arr.findIndex(o => o.startIndex === obj.startIndex && o.endIndex === obj.endIndex)
    );

    return uniqueJSONs.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Validate and attempt to recover JSON
   */
  validateAndRecoverJSON(jsonString: string): ValidationResult {
    let warnings: string[] = [];
    let recoveredText = jsonString;

    try {
      // First attempt: direct parsing
      const data = JSON.parse(jsonString);
      return {
        data,
        isValid: true,
        warnings: []
      };
    } catch (error) {
      // Recovery attempts
      const recoveryResult = this.recoverJSON(jsonString);
      recoveredText = recoveryResult.text;
      warnings = recoveryResult.warnings;

      try {
        const data = JSON.parse(recoveredText);
        return {
          data,
          isValid: true,
          warnings,
          recoveredText
        };
      } catch (finalError) {
        // If recovery fails, return partial data
        return {
          data: null,
          isValid: false,
          warnings: [...warnings, `Failed to parse JSON: ${finalError instanceof Error ? finalError.message : 'Unknown error'}`],
          recoveredText
        };
      }
    }
  }

  /**
   * Attempt to recover common JSON formatting issues
   */
  private recoverJSON(jsonString: string): { text: string; warnings: string[] } {
    let recovered = jsonString.trim();
    const warnings: string[] = [];

    // Handle single-line JSON that might be wrapped incorrectly
    if (recovered.startsWith('{') && !recovered.endsWith('}')) {
      // Try to find the complete JSON object by counting braces
      let braceCount = 0;
      let inString = false;
      let endPos = recovered.length;

      for (let i = 0; i < recovered.length; i++) {
        const char = recovered[i];
        if (char === '"' && (i === 0 || recovered[i-1] !== '\\')) {
          inString = !inString;
        }
        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              endPos = i + 1;
              break;
            }
          }
        }
      }

      if (braceCount > 0) {
        recovered += '}'.repeat(braceCount);
        warnings.push('Added missing closing braces');
      } else if (endPos < recovered.length) {
        recovered = recovered.substring(0, endPos);
        warnings.push('Trimmed incomplete JSON');
      }
    }

    // Remove trailing commas before closing braces/brackets
    if (/,(\s*[}\]])/g.test(recovered)) {
      recovered = recovered.replace(/,(\s*[}\]])/g, '$1');
      warnings.push('Removed trailing commas');
    }

    // Add missing commas between object properties (more aggressive)
    recovered = recovered.replace(/"}\s*"/g, '", "');
    recovered = recovered.replace(/"\s*\n\s*"/g, '", "');
    recovered = recovered.replace(/(\w)\s*"(?=\s*:)/g, '$1, "'); // Between property and quoted value

    // Fix array-to-object transitions
    recovered = recovered.replace(/]\s*{/g, ', {');
    recovered = recovered.replace(/}\s*\[/g, ', [');

    // Fix unbalanced quotes (more robust)
    const openBraces = (recovered.match(/\{/g) || []).length;
    const closeBraces = (recovered.match(/\}/g) || []).length;
    const openBrackets = (recovered.match(/\[/g) || []).length;
    const closeBrackets = (recovered.match(/\]/g) || []).length;

    if (openBraces > closeBraces) {
      recovered += '}'.repeat(openBraces - closeBraces);
      warnings.push('Added missing closing braces');
    }
    if (openBrackets > closeBrackets) {
      recovered += ']'.repeat(openBrackets - closeBrackets);
      warnings.push('Added missing closing brackets');
    }

    // Fix unquoted property names (more careful to avoid affecting values)
    recovered = recovered.replace(/(\w+)(?=\s*:)/g, '"$1"');

    return { text: recovered, warnings };
  }

  /**
   * Beautify JSON with proper indentation
   */
  beautifyJSON(data: any, indentation: number = 2): string {
    if (data === null || data === undefined) {
      return String(data);
    }

    try {
      return JSON.stringify(data, null, indentation);
    } catch (error) {
      return `Error beautifying JSON: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Generate tabular data from JSON
   */
  generateTabularData(data: any, basePath: string = ''): TabularRow[] {
    const rows: TabularRow[] = [];

    const processValue = (value: any, path: string): void => {
      if (value === null) {
        rows.push({
          path,
          value: 'null',
          type: 'null'
        });
      } else if (Array.isArray(value)) {
        rows.push({
          path,
          value: `[Array(${value.length})]`,
          type: 'array',
          size: value.length
        });

        value.forEach((item, index) => {
          processValue(item, `${path}[${index}]`);
        });
      } else if (typeof value === 'object') {
        rows.push({
          path,
          value: '[Object]',
          type: 'object',
          size: Object.keys(value).length
        });

        Object.entries(value).forEach(([key, val]) => {
          const newPath = path ? `${path}.${key}` : key;
          processValue(val, newPath);
        });
      } else {
        rows.push({
          path,
          value: String(value),
          type: typeof value as 'string' | 'number' | 'boolean'
        });
      }
    };

    processValue(data, basePath);

    return rows;
  }

  /**
   * Search for specific paths in tabular data
   */
  searchTabularData(rows: TabularRow[], searchTerm: string): TabularRow[] {
    if (!searchTerm.trim()) return rows;

    const lowerSearch = searchTerm.toLowerCase();
    return rows.filter(row =>
      row.path.toLowerCase().includes(lowerSearch) ||
      row.value.toLowerCase().includes(lowerSearch) ||
      row.type.toLowerCase().includes(lowerSearch)
    );
  }

  /**
   * Export tabular data as CSV
   */
  exportToCSV(rows: TabularRow[]): string {
    const headers = ['Path', 'Value', 'Type'];
    const csvRows = [headers.join(',')];

    rows.forEach(row => {
      const value = row.value.replace(/"/g, '""'); // Escape quotes
      csvRows.push(`"${row.path}","${value}","${row.type}"`);
    });

    return csvRows.join('\n');
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  }

  /**
   * Extract JSON objects from MOLI logs specifically
   */
  private extractMOLILogs(text: string): ExtractedJSON[] {
    const jsonObjects: ExtractedJSON[] = [];
    const lines = text.split('\n');

    let currentJsonText = '';
    let braceCount = 0;
    let bracketCount = 0;
    let inJsonString = false;
    let startIndex = -1;
    let lineIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and lines that are clearly text separators
      if (!line || line.match(/^(request|response)\s+\d+:/i)) {
        // If we have accumulated JSON text, process it
        if (currentJsonText.trim()) {
          const processedObject = this.processMOLIJsonText(currentJsonText, startIndex);
          if (processedObject) {
            jsonObjects.push(processedObject);
          }
          currentJsonText = '';
          braceCount = 0;
          bracketCount = 0;
          inJsonString = false;
          startIndex = -1;
        }
        continue;
      }

      // Check if line starts a JSON object
      if (line.includes('{') && braceCount === 0 && bracketCount === 0) {
        if (startIndex === -1) {
          startIndex = text.indexOf(line, lineIndex);
        }
      }

      // Track brace and bracket counts to find complete JSON objects
      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
          inJsonString = !inJsonString;
        }

        if (!inJsonString) {
          if (char === '{') braceCount++;
          else if (char === '}') braceCount--;
          else if (char === '[') bracketCount++;
          else if (char === ']') bracketCount--;
        }
      }

      currentJsonText += (currentJsonText ? ' ' : '') + line;
      lineIndex += lines[i].length + 1; // +1 for newline

      // If we've closed all braces and brackets, we have a complete JSON object
      if (braceCount === 0 && bracketCount === 0 && currentJsonText.trim()) {
        const processedObject = this.processMOLIJsonText(currentJsonText, startIndex);
        if (processedObject) {
          jsonObjects.push(processedObject);
        }
        currentJsonText = '';
        braceCount = 0;
        bracketCount = 0;
        inJsonString = false;
        startIndex = -1;
      }
    }

    // Process any remaining JSON text
    if (currentJsonText.trim()) {
      const processedObject = this.processMOLIJsonText(currentJsonText, startIndex);
      if (processedObject) {
        jsonObjects.push(processedObject);
      }
    }

    return jsonObjects;
  }

  /**
   * Process individual JSON text for MOLI metadata
   */
  private processMOLIJsonText(jsonText: string, startIndex: number): ExtractedJSON | null {
    if (!jsonText.trim()) return null;

    // Clean up patterns like "response 1: {{JSON}}" to extract just the JSON
    let cleanedText = jsonText;

    // Remove prefixes like "response 1:" or "request 2:"
    cleanedText = cleanedText.replace(/^(request|response)\s+\d+:\s*/i, '');

    // Remove extra braces around JSON like {{JSON}} -> {JSON}
    cleanedText = cleanedText.replace(/^\s*\{\{/, '{').replace(/\}\}\s*$/, '}');

    const validationResult = this.validateAndRecoverJSON(cleanedText);

    // Generate MOLI metadata
    const moliMetadata = this.generateMOLIMetadata(validationResult.data, cleanedText);

    return {
      id: `moli-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalText: jsonText,
      recoveredText: validationResult.recoveredText,
      parsedData: validationResult.data,
      isValid: validationResult.isValid,
      warnings: validationResult.warnings,
      startIndex: startIndex >= 0 ? startIndex : 0,
      endIndex: startIndex >= 0 ? startIndex + jsonText.length : jsonText.length,
      moliMetadata
    };
  }

  /**
   * Generate MOLI metadata from parsed JSON data
   */
  private generateMOLIMetadata(data: any, originalText: string): MOLIMetadata {
    let logType = MOLILogType.UNKNOWN;
    let service: string | undefined;
    let controller: string | undefined;
    let timestamp: string | undefined;
    let traceId: string | undefined;
    let isIncomplete = false;

    // Extract metadata from parsed JSON if it's a valid MOLI log
    if (data && typeof data === 'object') {
      // Determine if it's a request or response
      if (data.message) {
        if (data.message.toLowerCase() === 'request') {
          logType = MOLILogType.REQUEST;
        } else if (data.message.toLowerCase() === 'response') {
          logType = MOLILogType.RESPONSE;
        }
      }

      // Extract other metadata fields
      service = data.service;
      timestamp = data.timestamp;
      traceId = data.xray_trace_id;

      // Extract controller from globalContext
      if (data.globalContext && data.globalContext.controller) {
        controller = data.globalContext.controller;
      }
    }

    // Check if the original text suggests incompleteness
    if (originalText.includes('...') || originalText.match(/\{$/) || originalText.match(/\{$/)) {
      isIncomplete = true;
    }

    // Check if JSON parsing failed or data is null/undefined
    if (!data || data === null) {
      isIncomplete = true;
    }

    return {
      logType,
      service,
      controller,
      timestamp,
      traceId,
      isIncomplete
    };
  }
}