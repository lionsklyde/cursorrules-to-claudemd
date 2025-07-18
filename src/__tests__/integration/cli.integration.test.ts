import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { FileExplorerService } from '../../application/services/FileExplorerService.js';
import { FileConverterService } from '../../application/services/FileConverterService.js';
import { MetadataParserService } from '../../application/services/MetadataParserService.js';
import { AdvancedRootFileGeneratorService } from '../../application/services/AdvancedRootFileGeneratorService.js';

describe('CLI Integration Tests', () => {
  let testDir: string;
  let fileExplorer: FileExplorerService;
  let metadataParser: MetadataParserService;
  let fileConverter: FileConverterService;
  let rootFileGenerator: AdvancedRootFileGeneratorService;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `c2c-integration-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    
    fileExplorer = new FileExplorerService();
    metadataParser = new MetadataParserService();
    fileConverter = new FileConverterService();
    rootFileGenerator = new AdvancedRootFileGeneratorService();
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should handle root .cursor directory only', async () => {
    // Arrange
    const rootCursorDir = path.join(testDir, '.cursor');
    await fs.mkdir(rootCursorDir, { recursive: true });
    await fs.writeFile(
      path.join(rootCursorDir, 'global.mdc'),
      '---\nalwaysApply: true\n---\nGlobal rules content'
    );

    // Act
    const rootCursorDirFound = await fileExplorer.findRootCursorDirectory(testDir);
    const subCursorDirs = await fileExplorer.findSubCursorDirectories(testDir);
    
    if (rootCursorDirFound) {
      const rootFiles = await fileExplorer.findMdcFilesInDirectory(rootCursorDirFound, testDir);
      const parsedRules = metadataParser.parseFiles(rootFiles);
      await fileConverter.convertParsedFilesWithSeparateDirectories(parsedRules, testDir, rootCursorDirFound);
      await rootFileGenerator.generateRootFileForDirectory(parsedRules, rootCursorDirFound, path.join(testDir, 'c2c-rules'));
    }

    // Assert
    expect(rootCursorDirFound).toBe(rootCursorDir);
    expect(subCursorDirs).toHaveLength(0);
    
    const outputFile = path.join(testDir, 'c2c-rules', 'global.md');
    const rootFile = path.join(testDir, 'c2c-rules', '_root.md');
    
    expect(await fs.readFile(outputFile, 'utf-8')).toBe('Global rules content');
    expect(await fs.readFile(rootFile, 'utf-8')).toContain('@global.md');
  });

  it('should handle subdirectory .cursor directories only', async () => {
    // Arrange
    const project1CursorDir = path.join(testDir, 'project1', '.cursor');
    const project2CursorDir = path.join(testDir, 'project2', '.cursor');
    
    await fs.mkdir(project1CursorDir, { recursive: true });
    await fs.mkdir(project2CursorDir, { recursive: true });
    
    await fs.writeFile(
      path.join(project1CursorDir, 'rules.mdc'),
      '---\ndescription: "Project 1 rules"\n---\nProject 1 content'
    );
    await fs.writeFile(
      path.join(project2CursorDir, 'config.mdc'),
      '---\nglobs: "**/*.tsx"\n---\nProject 2 content'
    );

    // Act
    const rootCursorDir = await fileExplorer.findRootCursorDirectory(testDir);
    const subCursorDirs = await fileExplorer.findSubCursorDirectories(testDir);
    
    for (const cursorDir of subCursorDirs) {
      const files = await fileExplorer.findMdcFilesInDirectory(cursorDir, testDir);
      const parsedRules = metadataParser.parseFiles(files);
      const cursorParentDir = path.dirname(cursorDir);
      const outputDir = path.join(cursorParentDir, 'c2c-rules');
      
      await fileConverter.convertParsedFilesWithSeparateDirectories(parsedRules, testDir, cursorDir);
      await rootFileGenerator.generateRootFileForDirectory(parsedRules, cursorDir, outputDir);
    }

    // Assert
    expect(rootCursorDir).toBeNull();
    expect(subCursorDirs).toHaveLength(2);
    expect(subCursorDirs).toContain(project1CursorDir);
    expect(subCursorDirs).toContain(project2CursorDir);
    
    const project1Output = path.join(testDir, 'project1', 'c2c-rules', 'rules.md');
    const project1Root = path.join(testDir, 'project1', 'c2c-rules', '_root.md');
    const project2Output = path.join(testDir, 'project2', 'c2c-rules', 'config.md');
    const project2Root = path.join(testDir, 'project2', 'c2c-rules', '_root.md');
    
    expect(await fs.readFile(project1Output, 'utf-8')).toBe('Project 1 content');
    expect(await fs.readFile(project1Root, 'utf-8')).toContain('Project 1 rules');
    expect(await fs.readFile(project2Output, 'utf-8')).toBe('Project 2 content');
    expect(await fs.readFile(project2Root, 'utf-8')).toContain('**/*.tsx');
  });

  it('should handle both root and subdirectory .cursor directories', async () => {
    // Arrange
    const rootCursorDir = path.join(testDir, '.cursor');
    const projectCursorDir = path.join(testDir, 'project', '.cursor');
    
    await fs.mkdir(rootCursorDir, { recursive: true });
    await fs.mkdir(projectCursorDir, { recursive: true });
    
    await fs.writeFile(
      path.join(rootCursorDir, 'global.mdc'),
      '---\nalwaysApply: true\n---\nGlobal content'
    );
    await fs.writeFile(
      path.join(projectCursorDir, 'project.mdc'),
      '---\ndescription: "Project specific"\n---\nProject content'
    );

    // Act
    const rootCursorDirFound = await fileExplorer.findRootCursorDirectory(testDir);
    const subCursorDirs = await fileExplorer.findSubCursorDirectories(testDir);
    
    // Process root
    if (rootCursorDirFound) {
      const rootFiles = await fileExplorer.findMdcFilesInDirectory(rootCursorDirFound, testDir);
      const parsedRules = metadataParser.parseFiles(rootFiles);
      await fileConverter.convertParsedFilesWithSeparateDirectories(parsedRules, testDir, rootCursorDirFound);
      await rootFileGenerator.generateRootFileForDirectory(parsedRules, rootCursorDirFound, path.join(testDir, 'c2c-rules'));
    }
    
    // Process subdirectories
    for (const cursorDir of subCursorDirs) {
      const files = await fileExplorer.findMdcFilesInDirectory(cursorDir, testDir);
      const parsedRules = metadataParser.parseFiles(files);
      const cursorParentDir = path.dirname(cursorDir);
      const outputDir = path.join(cursorParentDir, 'c2c-rules');
      
      await fileConverter.convertParsedFilesWithSeparateDirectories(parsedRules, testDir, cursorDir);
      await rootFileGenerator.generateRootFileForDirectory(parsedRules, cursorDir, outputDir);
    }

    // Assert
    expect(rootCursorDirFound).toBe(rootCursorDir);
    expect(subCursorDirs).toHaveLength(1);
    expect(subCursorDirs[0]).toBe(projectCursorDir);
    
    // Check root output
    const rootOutput = path.join(testDir, 'c2c-rules', 'global.md');
    const rootIndexFile = path.join(testDir, 'c2c-rules', '_root.md');
    
    expect(await fs.readFile(rootOutput, 'utf-8')).toBe('Global content');
    expect(await fs.readFile(rootIndexFile, 'utf-8')).toContain('@global.md');
    
    // Check project output
    const projectOutput = path.join(testDir, 'project', 'c2c-rules', 'project.md');
    const projectIndexFile = path.join(testDir, 'project', 'c2c-rules', '_root.md');
    
    expect(await fs.readFile(projectOutput, 'utf-8')).toBe('Project content');
    expect(await fs.readFile(projectIndexFile, 'utf-8')).toContain('Project specific');
  });

  it('should handle nested subdirectory structures', async () => {
    // Arrange
    const nestedCursorDir = path.join(testDir, 'a', 'b', 'c', '.cursor');
    const nestedSubDir = path.join(nestedCursorDir, 'sub');
    await fs.mkdir(nestedSubDir, { recursive: true });
    
    await fs.writeFile(
      path.join(nestedSubDir, 'nested.mdc'),
      '---\nglobs: "**/*.vue"\n---\nNested content'
    );

    // Act
    const rootCursorDir = await fileExplorer.findRootCursorDirectory(testDir);
    const subCursorDirs = await fileExplorer.findSubCursorDirectories(testDir);
    
    for (const cursorDir of subCursorDirs) {
      const files = await fileExplorer.findMdcFilesInDirectory(cursorDir, testDir);
      const parsedRules = metadataParser.parseFiles(files);
      const cursorParentDir = path.dirname(cursorDir);
      const outputDir = path.join(cursorParentDir, 'c2c-rules');
      
      await fileConverter.convertParsedFilesWithSeparateDirectories(parsedRules, testDir, cursorDir);
      await rootFileGenerator.generateRootFileForDirectory(parsedRules, cursorDir, outputDir);
    }

    // Assert
    expect(rootCursorDir).toBeNull();
    expect(subCursorDirs).toHaveLength(1);
    expect(subCursorDirs[0]).toBe(nestedCursorDir);
    
    const nestedOutput = path.join(testDir, 'a', 'b', 'c', 'c2c-rules', 'sub', 'nested.md');
    const nestedIndex = path.join(testDir, 'a', 'b', 'c', 'c2c-rules', '_root.md');
    
    expect(await fs.readFile(nestedOutput, 'utf-8')).toBe('Nested content');
    expect(await fs.readFile(nestedIndex, 'utf-8')).toContain('sub/nested.md');
  });
});