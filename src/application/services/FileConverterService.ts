import path from 'path';
import { FileInfo } from '../../domain/models/FileInfo.js';
import { ParsedCursorRule } from '../../domain/models/CursorRuleMetadata.js';
import { FileSystemUtils } from '../../infrastructure/utils/FileSystemUtils.js';

export class FileConverterService {
  private readonly outputDir = 'c2c-rules';

  async convertFiles(files: FileInfo[], rootPath: string): Promise<string[]> {
    console.log('Converting files to c2c-rules directory...');
    
    const outputPaths: string[] = [];
    const absoluteOutputDir = path.join(rootPath, this.outputDir);

    for (const file of files) {
      const outputPath = await this.convertFile(file, rootPath, absoluteOutputDir);
      outputPaths.push(outputPath);
      console.log(`✓ Created ${path.relative(rootPath, outputPath)}`);
    }

    return outputPaths;
  }

  async convertParsedFiles(parsedRules: ParsedCursorRule[], rootPath: string): Promise<string[]> {
    console.log('Converting files to c2c-rules directory...');
    
    const outputPaths: string[] = [];
    const absoluteOutputDir = path.join(rootPath, this.outputDir);

    for (const rule of parsedRules) {
      const outputPath = await this.convertParsedFile(rule, rootPath, absoluteOutputDir);
      outputPaths.push(outputPath);
      console.log(`✓ Created ${path.relative(rootPath, outputPath)}`);
    }

    return outputPaths;
  }

  private async convertFile(file: FileInfo, _rootPath: string, outputDir: string): Promise<string> {
    const relativeDir = path.dirname(file.relativePath);
    const projectPath = this.extractProjectPath(relativeDir);
    
    const outputDirPath = path.join(outputDir, projectPath);
    const outputFileName = `${file.fileName}.md`;
    const outputPath = path.join(outputDirPath, outputFileName);

    await FileSystemUtils.writeFile(outputPath, file.content);
    
    return outputPath;
  }

  private async convertParsedFile(rule: ParsedCursorRule, _rootPath: string, outputDir: string): Promise<string> {
    const relativeDir = path.dirname(rule.relativePath);
    const projectPath = this.extractProjectPath(relativeDir);
    
    const outputDirPath = path.join(outputDir, projectPath);
    const outputFileName = `${rule.fileName}.md`;
    const outputPath = path.join(outputDirPath, outputFileName);

    // Write only the content, not the metadata
    await FileSystemUtils.writeFile(outputPath, rule.content);
    
    return outputPath;
  }

  private extractProjectPath(relativePath: string): string {
    const parts = relativePath.split(path.sep);
    const cursorIndex = parts.indexOf('.cursor');
    
    if (cursorIndex === -1) {
      return relativePath;
    }

    const projectParts = parts.slice(0, cursorIndex);
    const subParts = parts.slice(cursorIndex + 1);
    
    return [...projectParts, ...subParts].join(path.sep);
  }

  async convertFilesWithSeparateDirectories(
    files: FileInfo[], 
    rootPath: string, 
    cursorDirPath: string
  ): Promise<string[]> {
    console.log('Converting files to c2c-rules directory...');
    
    const outputPaths: string[] = [];
    
    // Determine the output directory based on cursor directory location
    const cursorParentDir = path.dirname(cursorDirPath);
    const outputDir = path.join(cursorParentDir, this.outputDir);

    for (const file of files) {
      const outputPath = await this.convertFileToSpecificDir(file, cursorDirPath, outputDir);
      outputPaths.push(outputPath);
      console.log(`✓ Created ${path.relative(rootPath, outputPath)}`);
    }

    return outputPaths;
  }

  async convertParsedFilesWithSeparateDirectories(
    parsedRules: ParsedCursorRule[], 
    rootPath: string, 
    cursorDirPath: string
  ): Promise<string[]> {
    console.log('Converting files to c2c-rules directory...');
    
    const outputPaths: string[] = [];
    
    // Determine the output directory based on cursor directory location
    const cursorParentDir = path.dirname(cursorDirPath);
    const outputDir = path.join(cursorParentDir, this.outputDir);

    for (const rule of parsedRules) {
      const outputPath = await this.convertParsedFileToSpecificDir(rule, cursorDirPath, outputDir);
      outputPaths.push(outputPath);
      console.log(`✓ Created ${path.relative(rootPath, outputPath)}`);
    }

    return outputPaths;
  }

  private async convertFileToSpecificDir(
    file: FileInfo, 
    cursorDirPath: string, 
    outputDir: string
  ): Promise<string> {
    // Get the relative path from the cursor directory
    const fileRelativeToCursor = path.relative(cursorDirPath, file.originalPath);
    const outputPath = path.join(outputDir, fileRelativeToCursor.replace('.mdc', '.md'));

    await FileSystemUtils.writeFile(outputPath, file.content);
    
    return outputPath;
  }

  private async convertParsedFileToSpecificDir(
    rule: ParsedCursorRule, 
    _cursorDirPath: string, 
    outputDir: string
  ): Promise<string> {
    // Extract the path relative to the cursor directory from the rule's relativePath
    const parts = rule.relativePath.split(path.sep);
    const cursorIndex = parts.indexOf('.cursor');
    
    if (cursorIndex !== -1) {
      // Get the part after .cursor
      const afterCursor = parts.slice(cursorIndex + 1);
      const relativePath = afterCursor.join(path.sep);
      const outputPath = path.join(outputDir, relativePath.replace('.mdc', '.md'));
      
      await FileSystemUtils.writeFile(outputPath, rule.content);
      return outputPath;
    }
    
    // Fallback: use just the filename
    const outputPath = path.join(outputDir, `${rule.fileName}.md`);
    await FileSystemUtils.writeFile(outputPath, rule.content);
    
    return outputPath;
  }
}