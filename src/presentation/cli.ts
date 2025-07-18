#!/usr/bin/env node

import { Command } from 'commander';
import { FileExplorerService } from '../application/services/FileExplorerService.js';
import { FileConverterService } from '../application/services/FileConverterService.js';
import { MetadataParserService } from '../application/services/MetadataParserService.js';
import { AdvancedRootFileGeneratorService } from '../application/services/AdvancedRootFileGeneratorService.js';
import { ClaudeMdService } from '../application/services/ClaudeMdService.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const program = new Command();

program
  .name('c2c')
  .description('Convert Cursor IDE rules to Claude AI markdown format')
  .version(packageJson.version)
  .action(async () => {
    try {
      const rootPath = process.cwd();
      
      // Initialize services
      const fileExplorer = new FileExplorerService();
      const metadataParser = new MetadataParserService();
      const fileConverter = new FileConverterService();
      const rootFileGenerator = new AdvancedRootFileGeneratorService();
      const claudeMdService = new ClaudeMdService();
      
      // Find root .cursor directory
      const rootCursorDir = await fileExplorer.findRootCursorDirectory(rootPath);
      
      // Find subdirectory .cursor directories with .mdc files
      const subCursorDirs = await fileExplorer.findSubCursorDirectories(rootPath);
      
      if (!rootCursorDir && subCursorDirs.length === 0) {
        console.log('No .cursor directories with .mdc files found.');
        return;
      }
      
      // Process root .cursor directory if it exists
      if (rootCursorDir) {
        console.log('Processing root .cursor directory...');
        const rootFiles = await fileExplorer.findMdcFilesInDirectory(rootCursorDir, rootPath);
        
        if (rootFiles.length > 0) {
          const parsedRules = metadataParser.parseFiles(rootFiles);
          await fileConverter.convertParsedFilesWithSeparateDirectories(parsedRules, rootPath, rootCursorDir);
          await rootFileGenerator.generateRootFileForDirectory(parsedRules, rootCursorDir, join(rootPath, 'c2c-rules'));
          await claudeMdService.updateClaudeMdFile(rootPath);
        }
      }
      
      // Process each subdirectory .cursor directory
      for (const cursorDir of subCursorDirs) {
        console.log(`Processing ${cursorDir}...`);
        const files = await fileExplorer.findMdcFilesInDirectory(cursorDir, rootPath);
        
        if (files.length > 0) {
          const parsedRules = metadataParser.parseFiles(files);
          const cursorParentDir = dirname(cursorDir);
          const outputDir = join(cursorParentDir, 'c2c-rules');
          
          await fileConverter.convertParsedFilesWithSeparateDirectories(parsedRules, rootPath, cursorDir);
          await rootFileGenerator.generateRootFileForDirectory(parsedRules, cursorDir, outputDir);
          await claudeMdService.updateClaudeMdFile(cursorParentDir);
        }
      }
      
      console.log('\nConversion completed successfully!');
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();