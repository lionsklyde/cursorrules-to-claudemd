import path from 'path';
import { FileInfo } from '../../domain/models/FileInfo.js';
import { FileSystemUtils } from '../../infrastructure/utils/FileSystemUtils.js';

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
}