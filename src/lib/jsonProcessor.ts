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
    let recovered = jsonString;
    const warnings: string[] = [];

    // Remove trailing commas
    if (/,(\s*[}\]])/g.test(recovered)) {
      recovered = recovered.replace(/,(\s*[}\]])/g, '$1');
      warnings.push('Removed trailing commas');
    }

    // Add missing commas between object properties
    recovered = recovered.replace(/"}\s*"/g, '", "');
    recovered = recovered.replace(/]\s*{/g, ', {');
    recovered = recovered.replace(/}\s*\[/g, ', [');
    recovered = recovered.replace(/"\s*\n\s*"/g, '", "');

    // Fix unbalanced quotes (basic attempt)
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

    // Fix unquoted property names
    recovered = recovered.replace(/(\w+):/g, '"$1":');

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
}