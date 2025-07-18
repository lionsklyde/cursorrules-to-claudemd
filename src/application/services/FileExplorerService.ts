import path from 'path';
import { FileInfo } from '../../domain/models/FileInfo.js';
import { FileSystemUtils } from '../../infrastructure/utils/FileSystemUtils.js';
import { promises as fs } from 'fs';

export class FileExplorerService {
  async findMdcFiles(rootPath: string): Promise<FileInfo[]> {
    console.log('Scanning for .cursor directories...\n');
    
    const cursorDirs = await FileSystemUtils.findDirectories(rootPath, '.cursor');
    const fileInfos: FileInfo[] = [];

    for (const cursorDir of cursorDirs) {
      const mdcFiles = await FileSystemUtils.findFilesInDirectory(cursorDir, '.mdc');
      
      for (const filePath of mdcFiles) {
        const content = await FileSystemUtils.readFileContent(filePath);
        const relativePath = path.relative(rootPath, filePath);
        const fileName = path.basename(filePath, '.mdc');
        
        fileInfos.push({
          originalPath: filePath,
          relativePath,
          fileName,
          content
        });
      }
    }

    console.log(`Found ${fileInfos.length} .mdc files:`);
    fileInfos.forEach(file => {
      console.log(`- ${file.relativePath}`);
    });
    console.log();

    return fileInfos;
  }

  async findRootCursorDirectory(rootPath: string): Promise<string | null> {
    const rootCursorPath = path.join(rootPath, '.cursor');
    try {
      const stats = await fs.stat(rootCursorPath);
      if (stats.isDirectory()) {
        return rootCursorPath;
      }
    } catch (error) {
      // Directory doesn't exist
    }
    return null;
  }

  async findSubCursorDirectories(rootPath: string): Promise<string[]> {
    const allCursorDirs = await FileSystemUtils.findDirectories(rootPath, '.cursor');
    const rootCursorPath = path.join(rootPath, '.cursor');
    const subCursorDirs: string[] = [];

    for (const cursorDir of allCursorDirs) {
      // Skip root .cursor directory
      if (cursorDir === rootCursorPath) {
        continue;
      }

      // Check if this .cursor directory has any .mdc files
      const mdcFiles = await FileSystemUtils.findFilesInDirectory(cursorDir, '.mdc');
      if (mdcFiles.length > 0) {
        subCursorDirs.push(cursorDir);
      }
    }

    return subCursorDirs;
  }

  async findMdcFilesInDirectory(cursorDir: string, rootPath: string): Promise<FileInfo[]> {
    const fileInfos: FileInfo[] = [];
    const mdcFiles = await FileSystemUtils.findFilesInDirectory(cursorDir, '.mdc');
    
    for (const filePath of mdcFiles) {
      const content = await FileSystemUtils.readFileContent(filePath);
      const relativePath = path.relative(rootPath, filePath);
      const fileName = path.basename(filePath, '.mdc');
      
      fileInfos.push({
        originalPath: filePath,
        relativePath,
        fileName,
        content
      });
    }

    return fileInfos;
  }
}