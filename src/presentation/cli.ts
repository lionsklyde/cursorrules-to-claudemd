#!/usr/bin/env node

import { Command } from 'commander';
import { FileExplorerService } from '../application/services/FileExplorerService.js';
import { FileConverterService } from '../application/services/FileConverterService.js';
import { MetadataParserService } from '../application/services/MetadataParserService.js';
import { AdvancedRootFileGeneratorService } from '../application/services/AdvancedRootFileGeneratorService.js';
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
      
      // Find .mdc files
      const files = await fileExplorer.findMdcFiles(rootPath);
      
      if (files.length === 0) {
        console.log('No .mdc files found in .cursor directories.');
        return;
      }
      
      // Parse metadata from files
      const parsedRules = metadataParser.parseFiles(files);
      
      // Convert files (with metadata stripped)
      await fileConverter.convertParsedFiles(parsedRules, rootPath);
      
      // Generate advanced root file
      await rootFileGenerator.generateRootFile(parsedRules, rootPath);
      
      console.log('\nConversion completed successfully!');
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();