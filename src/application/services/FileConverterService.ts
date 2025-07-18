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
}