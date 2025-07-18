import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { FileExplorerService } from '../../application/services/FileExplorerService.js';
import { FileConverterService } from '../../application/services/FileConverterService.js';
import { MetadataParserService } from '../../application/services/MetadataParserService.js';
import { AdvancedRootFileGeneratorService } from '../../application/services/AdvancedRootFileGeneratorService.js';
import { ClaudeMdService } from '../../application/services/ClaudeMdService.js';

describe('CLI Integration Tests', () => {
  let testDir: string;
  let fileExplorer: FileExplorerService;
  let metadataParser: MetadataParserService;
  let fileConverter: FileConverterService;
  let rootFileGenerator: AdvancedRootFileGeneratorService;
  let claudeMdService: ClaudeMdService;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `c2c-integration-test-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);
    await fs.mkdir(testDir, { recursive: true });
    
    fileExplorer = new FileExplorerService();
    metadataParser = new MetadataParserService();
    fileConverter = new FileConverterService();
    rootFileGenerator = new AdvancedRootFileGeneratorService();
    claudeMdService = new ClaudeMdService();
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
      await claudeMdService.updateClaudeMdFile(testDir);
    }

    // Assert
    expect(rootCursorDirFound).toBe(rootCursorDir);
    expect(subCursorDirs).toHaveLength(0);
    
    const outputFile = path.join(testDir, 'c2c-rules', 'global.md');
    const rootFile = path.join(testDir, 'c2c-rules', '_root.md');
    const claudeMdFile = path.join(testDir, 'CLAUDE.md');
    
    expect(await fs.readFile(outputFile, 'utf-8')).toBe('Global rules content');
    expect(await fs.readFile(rootFile, 'utf-8')).toContain('@global.md');
    expect(await fs.readFile(claudeMdFile, 'utf-8')).toContain('<c2c-rules>');
    expect(await fs.readFile(claudeMdFile, 'utf-8')).toContain('- @c2c-rules/_root.md');
    expect(await fs.readFile(claudeMdFile, 'utf-8')).toContain('</c2c-rules>');
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
      await claudeMdService.updateClaudeMdFile(cursorParentDir);
    }

    // Assert
    expect(rootCursorDir).toBeNull();
    expect(subCursorDirs).toHaveLength(2);
    expect(subCursorDirs).toContain(project1CursorDir);
    expect(subCursorDirs).toContain(project2CursorDir);
    
    const project1Output = path.join(testDir, 'project1', 'c2c-rules', 'rules.md');
    const project1Root = path.join(testDir, 'project1', 'c2c-rules', '_root.md');
    const project1ClaudeMd = path.join(testDir, 'project1', 'CLAUDE.md');
    const project2Output = path.join(testDir, 'project2', 'c2c-rules', 'config.md');
    const project2Root = path.join(testDir, 'project2', 'c2c-rules', '_root.md');
    const project2ClaudeMd = path.join(testDir, 'project2', 'CLAUDE.md');
    
    expect(await fs.readFile(project1Output, 'utf-8')).toBe('Project 1 content');
    expect(await fs.readFile(project1Root, 'utf-8')).toContain('Project 1 rules');
    expect(await fs.readFile(project1ClaudeMd, 'utf-8')).toContain('- @c2c-rules/_root.md');
    expect(await fs.readFile(project2Output, 'utf-8')).toBe('Project 2 content');
    expect(await fs.readFile(project2Root, 'utf-8')).toContain('**/*.tsx');
    expect(await fs.readFile(project2ClaudeMd, 'utf-8')).toContain('- @c2c-rules/_root.md');
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
      await claudeMdService.updateClaudeMdFile(testDir);
    }
    
    // Process subdirectories
    for (const cursorDir of subCursorDirs) {
      const files = await fileExplorer.findMdcFilesInDirectory(cursorDir, testDir);
      const parsedRules = metadataParser.parseFiles(files);
      const cursorParentDir = path.dirname(cursorDir);
      const outputDir = path.join(cursorParentDir, 'c2c-rules');
      
      await fileConverter.convertParsedFilesWithSeparateDirectories(parsedRules, testDir, cursorDir);
      await rootFileGenerator.generateRootFileForDirectory(parsedRules, cursorDir, outputDir);
      await claudeMdService.updateClaudeMdFile(cursorParentDir);
    }

    // Assert
    expect(rootCursorDirFound).toBe(rootCursorDir);
    expect(subCursorDirs).toHaveLength(1);
    expect(subCursorDirs[0]).toBe(projectCursorDir);
    
    // Check root output
    const rootOutput = path.join(testDir, 'c2c-rules', 'global.md');
    const rootIndexFile = path.join(testDir, 'c2c-rules', '_root.md');
    const rootClaudeMd = path.join(testDir, 'CLAUDE.md');
    
    expect(await fs.readFile(rootOutput, 'utf-8')).toBe('Global content');
    expect(await fs.readFile(rootIndexFile, 'utf-8')).toContain('@global.md');
    expect(await fs.readFile(rootClaudeMd, 'utf-8')).toContain('- @c2c-rules/_root.md');
    
    // Check project output
    const projectOutput = path.join(testDir, 'project', 'c2c-rules', 'project.md');
    const projectIndexFile = path.join(testDir, 'project', 'c2c-rules', '_root.md');
    const projectClaudeMd = path.join(testDir, 'project', 'CLAUDE.md');
    
    expect(await fs.readFile(projectOutput, 'utf-8')).toBe('Project content');
    expect(await fs.readFile(projectIndexFile, 'utf-8')).toContain('Project specific');
    expect(await fs.readFile(projectClaudeMd, 'utf-8')).toContain('- @c2c-rules/_root.md');
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
      await claudeMdService.updateClaudeMdFile(cursorParentDir);
    }

    // Assert
    expect(rootCursorDir).toBeNull();
    expect(subCursorDirs).toHaveLength(1);
    expect(subCursorDirs[0]).toBe(nestedCursorDir);
    
    const nestedOutput = path.join(testDir, 'a', 'b', 'c', 'c2c-rules', 'sub', 'nested.md');
    const nestedIndex = path.join(testDir, 'a', 'b', 'c', 'c2c-rules', '_root.md');
    const nestedClaudeMd = path.join(testDir, 'a', 'b', 'c', 'CLAUDE.md');
    
    expect(await fs.readFile(nestedOutput, 'utf-8')).toBe('Nested content');
    expect(await fs.readFile(nestedIndex, 'utf-8')).toContain('sub/nested.md');
    expect(await fs.readFile(nestedClaudeMd, 'utf-8')).toContain('- @c2c-rules/_root.md');
  });

  it('should handle existing CLAUDE.md file with existing c2c-rules section', async () => {
    // Arrange
    const projectCursorDir = path.join(testDir, 'project', '.cursor');
    await fs.mkdir(projectCursorDir, { recursive: true });
    
    await fs.writeFile(
      path.join(projectCursorDir, 'project.mdc'),
      '---\ndescription: "Project rules"\n---\nProject content'
    );

    // Create existing CLAUDE.md with old c2c-rules section
    const existingClaudeMd = `# CLAUDE.md

This is an existing CLAUDE.md file with project instructions.

<c2c-rules>
- @old-rules/_root.md
- @another-old-rule.md
</c2c-rules>

## Additional sections

More content here.`;

    await fs.writeFile(path.join(testDir, 'project', 'CLAUDE.md'), existingClaudeMd);

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
      await claudeMdService.updateClaudeMdFile(cursorParentDir);
    }

    // Assert
    expect(rootCursorDir).toBeNull();
    expect(subCursorDirs).toHaveLength(1);
    
    const projectOutput = path.join(testDir, 'project', 'c2c-rules', 'project.md');
    const projectIndexFile = path.join(testDir, 'project', 'c2c-rules', '_root.md');
    const projectClaudeMd = path.join(testDir, 'project', 'CLAUDE.md');
    
    expect(await fs.readFile(projectOutput, 'utf-8')).toBe('Project content');
    expect(await fs.readFile(projectIndexFile, 'utf-8')).toContain('Project rules');
    
    const claudeMdContent = await fs.readFile(projectClaudeMd, 'utf-8');
    expect(claudeMdContent).toContain('This is an existing CLAUDE.md file with project instructions.');
    expect(claudeMdContent).toContain('More content here.');
    expect(claudeMdContent).toContain('- @c2c-rules/_root.md');
    expect(claudeMdContent).not.toContain('old-rules');
    expect(claudeMdContent).not.toContain('another-old-rule');
    
    // Should have only one c2c-rules section
    const matches = claudeMdContent.match(/<c2c-rules>/g);
    expect(matches).toHaveLength(1);
  });
});