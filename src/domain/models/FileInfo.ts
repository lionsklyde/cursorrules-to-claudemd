export interface FileInfo {
  originalPath: string;
  relativePath: string;
  fileName: string;
  content: string;
}

export interface ConversionResult {
  totalFiles: number;
  processedFiles: FileInfo[];
  outputPath: string;
}