import {
  ExtractedJSON,
  TabularRow,
  ValidationResult,
  MOLIMetadata,
  MOLILogType,
} from "@/types/json";

export class JSONProcessor {
  /**
   * Extract all JSON objects from text input
   */
  extractJSONObjects(text: string, moliMode: boolean = false): ExtractedJSON[] {
    if (moliMode) {
      return this.extractMOLILogs(text);
    }

    return this.extractGenericJSON(text);
  }

  extractGenericJSON(text: string): ExtractedJSON[] {
    const jsonObjects: ExtractedJSON[] = [];

    let startIndex = -1;
    let braceCount = 0;
    let inString = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Toggle string state
      if (char === '"' && text[i - 1] !== "\\") {
        inString = !inString;
      }

      if (!inString) {
        if (char === "{") {
          if (braceCount === 0) startIndex = i;
          braceCount++;
        } else if (char === "}") {
          braceCount--;

          if (braceCount === 0 && startIndex !== -1) {
            const jsonText = text.substring(startIndex, i + 1);
            const validationResult = this.validateAndRecoverJSON(jsonText);

            jsonObjects.push({
              id: `json-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              originalText: jsonText,
              recoveredText: validationResult.recoveredText,
              parsedData: validationResult.data,
              isValid: validationResult.isValid,
              warnings: validationResult.warnings,
              startIndex,
              endIndex: i + 1,
            });

            startIndex = -1;
          }
        }
      }
    }

    return jsonObjects;
  }

  /**
   * Validate and attempt to recover JSON
   */
  validateAndRecoverJSON(jsonString: string): ValidationResult {
    // Stage 1: direct parse attempt
    try {
      return {
        data: JSON.parse(jsonString),
        isValid: true,
        warnings: [],
        recoveredText: jsonString,
      };
    } catch {}

    // Stage 2: attempt structured repair
    const { repaired, warnings } = this.repairJSON(jsonString);

    try {
      return {
        data: JSON.parse(repaired),
        isValid: true,
        warnings,
        recoveredText: repaired,
      };
    } catch (err) {
      return {
        data: null,
        isValid: false,
        warnings: [
          ...warnings,
          `Failed to parse JSON: ${(err as Error).message}`,
        ],
        recoveredText: repaired,
      };
    }
  }

  private repairJSON(bad: string): { repaired: string; warnings: string[] } {
    const warnings: string[] = [];
    let text = bad.trim();

    // Remove invisible junk
    text = text.replace(/[^\S\r\n]+$/gm, "");

    // ---- 1. Remove trailing commas ----
    if (/,(\s*[}\]])/g.test(text)) {
      text = text.replace(/,(\s*[}\]])/g, "$1");
      warnings.push("Removed trailing commas");
    }

    // ---- 2. Fix unquoted keys ----
    text = text.replace(/([{,]\s*)([A-Za-z0-9_]+)(\s*):/g, '$1"$2"$3:');
    warnings.push("Fixed unquoted keys");

    // ---- 3. Close incomplete strings ----
    const quoteCount = (text.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      text += '"';
      warnings.push("Closed unmatched quotes");
    }

    // ---- 4. Balance braces/brackets ----
    const opens = (text.match(/{/g) || []).length;
    const closes = (text.match(/}/g) || []).length;
    if (opens > closes) {
      text += "}".repeat(opens - closes);
      warnings.push("Added missing closing braces");
    }
    if (closes > opens) {
      text = text.replace(/}$/, "");
      warnings.push("Removed excessive closing braces");
    }

    const arrOpens = (text.match(/\[/g) || []).length;
    const arrCloses = (text.match(/]/g) || []).length;
    if (arrOpens > arrCloses) {
      text += "]".repeat(arrOpens - arrCloses);
      warnings.push("Added missing closing brackets");
    }

    // ---- 5. Fix missing commas between fields ----
    text = text.replace(/"(\s*)"/g, '", "$1');
    warnings.push("Inserted missing commas");

    // ---- 6. If JSON ends inside a string or object, trim extraneous garbage ----
    const lastBrace = text.lastIndexOf("}");
    if (lastBrace !== -1 && lastBrace !== text.length - 1) {
      text = text.slice(0, lastBrace + 1);
      warnings.push("Trimmed trailing non-JSON content");
    }

    return { repaired: text, warnings };
  }

  /**
   * Attempt to recover common JSON formatting issues
   */
  private recoverJSON(jsonString: string): {
    text: string;
    warnings: string[];
  } {
    let recovered = jsonString.trim();
    const warnings: string[] = [];

    // Handle single-line JSON that might be wrapped incorrectly
    if (recovered.startsWith("{") && !recovered.endsWith("}")) {
      // Try to find the complete JSON object by counting braces
      let braceCount = 0;
      let inString = false;
      let endPos = recovered.length;

      for (let i = 0; i < recovered.length; i++) {
        const char = recovered[i];
        if (char === '"' && (i === 0 || recovered[i - 1] !== "\\")) {
          inString = !inString;
        }
        if (!inString) {
          if (char === "{") braceCount++;
          else if (char === "}") {
            braceCount--;
            if (braceCount === 0) {
              endPos = i + 1;
              break;
            }
          }
        }
      }

      if (braceCount > 0) {
        recovered += "}".repeat(braceCount);
        warnings.push("Added missing closing braces");
      } else if (endPos < recovered.length) {
        recovered = recovered.substring(0, endPos);
        warnings.push("Trimmed incomplete JSON");
      }
    }

    // Remove trailing commas before closing braces/brackets (more robust)
    if (/,(\s*[}\]])/g.test(recovered)) {
      recovered = recovered.replace(/,(\s*[}\]])/g, "$1");
      warnings.push("Removed trailing commas");
    }

    // Add missing commas between object properties (more aggressive)
    recovered = recovered.replace(/"}\s*"/g, '", "');
    recovered = recovered.replace(/"\s*\n\s*"/g, '", "');
    recovered = recovered.replace(/(\w)\s*"(?=\s*:)/g, '$1, "'); // Between property and quoted value

    // Fix array-to-object transitions
    recovered = recovered.replace(/]\s*{/g, ", {");
    recovered = recovered.replace(/}\s*\[/g, ", [");

    // Fix unbalanced quotes (more robust)
    const openBraces = (recovered.match(/\{/g) || []).length;
    const closeBraces = (recovered.match(/\}/g) || []).length;
    const openBrackets = (recovered.match(/\[/g) || []).length;
    const closeBrackets = (recovered.match(/\]/g) || []).length;

    if (openBraces > closeBraces) {
      recovered += "}".repeat(openBraces - closeBraces);
      warnings.push("Added missing closing braces");
    }
    if (openBrackets > closeBrackets) {
      recovered += "]".repeat(openBrackets - closeBrackets);
      warnings.push("Added missing closing brackets");
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
      return `Error beautifying JSON: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  }

  /**
   * Generate tabular data from JSON
   */
  generateTabularData(data: any, basePath: string = ""): TabularRow[] {
    const rows: TabularRow[] = [];

    const processValue = (value: any, path: string): void => {
      if (value === null) {
        rows.push({
          path,
          value: "null",
          type: "null",
        });
      } else if (Array.isArray(value)) {
        rows.push({
          path,
          value: `[Array(${value.length})]`,
          type: "array",
          size: value.length,
        });

        value.forEach((item, index) => {
          processValue(item, `${path}[${index}]`);
        });
      } else if (typeof value === "object") {
        rows.push({
          path,
          value: "[Object]",
          type: "object",
          size: Object.keys(value).length,
        });

        Object.entries(value).forEach(([key, val]) => {
          const newPath = path ? `${path}.${key}` : key;
          processValue(val, newPath);
        });
      } else {
        rows.push({
          path,
          value: String(value),
          type: typeof value as "string" | "number" | "boolean",
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
    return rows.filter(
      (row) =>
        row.path.toLowerCase().includes(lowerSearch) ||
        row.value.toLowerCase().includes(lowerSearch) ||
        row.type.toLowerCase().includes(lowerSearch)
    );
  }

  /**
   * Export tabular data as CSV
   */
  exportToCSV(rows: TabularRow[]): string {
    const headers = ["Path", "Value", "Type"];
    const csvRows = [headers.join(",")];

    rows.forEach((row) => {
      const value = row.value.replace(/"/g, '""'); // Escape quotes
      csvRows.push(`"${row.path}","${value}","${row.type}"`);
    });

    return csvRows.join("\n");
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
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      return success;
    }
  }

  /**
   * Extract JSON objects from MOLI logs safely
   */
  private extractMOLILogs(text: string): ExtractedJSON[] {
    const out: ExtractedJSON[] = [];

    let depth = 0;
    let inString = false;
    let escape = false;
    let start = -1;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (!escape && ch === "\\") {
        escape = true;
        continue;
      }

      if (!escape && ch === '"') {
        inString = !inString;
      }

      if (!inString) {
        if (ch === "{") {
          if (depth === 0) start = i;
          depth++;
        } else if (ch === "}") {
          depth--;
          if (depth === 0 && start !== -1) {
            const raw = text.slice(start, i + 1);
            const parsed = this.processMOLIJsonText(raw, start);
            if (parsed) out.push(parsed);
            start = -1;
          }
        }
      }

      escape = false;
    }

    // Handle trailing truncated MOLI JSON
    if (start !== -1) {
      const raw = text.slice(start);
      const parsed = this.processMOLIJsonText(raw, start);
      if (parsed) out.push(parsed);
    }

    return out;
  }

  /**
   * Process individual JSON text for MOLI metadata
   */
  private processMOLIJsonText(
    jsonText: string,
    startIndex: number
  ): ExtractedJSON | null {
    if (!jsonText.trim()) return null;

    let cleaned = jsonText.trim();

    // Fix common MOLI truncation: cut off at last real "}"
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace !== -1 && lastBrace !== cleaned.length - 1) {
      cleaned = cleaned.slice(0, lastBrace + 1);
    }

    const validationResult = this.validateAndRecoverJSON(cleaned);

    const metadata = this.generateMOLIMetadata(validationResult.data, cleaned);

    return {
      id: `moli-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalText: jsonText,
      recoveredText: validationResult.recoveredText,
      parsedData: validationResult.data,
      isValid: validationResult.isValid,
      warnings: validationResult.warnings,
      startIndex,
      endIndex: startIndex + jsonText.length,
      moliMetadata: metadata,
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
    if (data && typeof data === "object") {
      // Determine if it's a request or response
      if (data.message) {
        if (data.message.toLowerCase() === "request") {
          logType = MOLILogType.REQUEST;
        } else if (data.message.toLowerCase() === "response") {
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
    if (
      originalText.includes("...") ||
      originalText.match(/\{$/) ||
      originalText.match(/\{$/)
    ) {
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
      isIncomplete,
    };
  }
}
