import { promises as fs } from 'fs';
import path from 'path';

export class FileSystemUtils {
  static async findDirectories(rootPath: string, targetDirName: string): Promise<string[]> {
    const directories: string[] = [];

    async function searchDir(dirPath: string): Promise<void> {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.name === targetDirName) {
              directories.push(fullPath);
            }
            
            await searchDir(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
      }
    }

    await searchDir(rootPath);
    return directories;
  }

  static async findFilesInDirectory(dirPath: string, extension: string): Promise<string[]> {
    const files: string[] = [];

    async function searchFiles(currentPath: string): Promise<void> {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          
          if (entry.isDirectory()) {
            await searchFiles(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(extension)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error reading files in ${currentPath}:`, error);
      }
    }

    await searchFiles(dirPath);
    return files;
  }

  static async readFileContent(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  static async ensureDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await this.ensureDirectory(dir);
    await fs.writeFile(filePath, content, 'utf-8');
  }
}