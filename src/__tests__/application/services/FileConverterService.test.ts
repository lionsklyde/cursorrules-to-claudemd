import { FileConverterService } from '../../../application/services/FileConverterService.js';
import { FileInfo } from '../../../domain/models/FileInfo.js';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('FileConverterService', () => {
  let testDir: string;
  let service: FileConverterService;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `c2c-test-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);
    await fs.mkdir(testDir, { recursive: true });
    service = new FileConverterService();
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('convertFiles', () => {
    it('should convert files and maintain directory structure', async () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: path.join(testDir, 'project1', '.cursor', 'rules.mdc'),
          relativePath: path.join('project1', '.cursor', 'rules.mdc'),
          fileName: 'rules',
          content: 'Rule content'
        },
        {
          originalPath: path.join(testDir, 'project2', '.cursor', 'sub', 'config.mdc'),
          relativePath: path.join('project2', '.cursor', 'sub', 'config.mdc'),
          fileName: 'config',
          content: 'Config content'
        }
      ];

      // Act
      const outputPaths = await service.convertFiles(files, testDir);

      // Assert
      expect(outputPaths).toHaveLength(2);
      
      const expectedPath1 = path.join(testDir, 'c2c-rules', 'project1', 'rules.md');
      const expectedPath2 = path.join(testDir, 'c2c-rules', 'project2', 'sub', 'config.md');
      
      expect(outputPaths[0]).toBe(expectedPath1);
      expect(outputPaths[1]).toBe(expectedPath2);
      
      const content1 = await fs.readFile(expectedPath1, 'utf-8');
      const content2 = await fs.readFile(expectedPath2, 'utf-8');
      
      expect(content1).toBe('Rule content');
      expect(content2).toBe('Config content');
    });

    it('should handle files at root level .cursor directory', async () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: path.join(testDir, '.cursor', 'global.mdc'),
          relativePath: path.join('.cursor', 'global.mdc'),
          fileName: 'global',
          content: 'Global content'
        }
      ];

      // Act
      const outputPaths = await service.convertFiles(files, testDir);

      // Assert
      const expectedPath = path.join(testDir, 'c2c-rules', 'global.md');
      expect(outputPaths[0]).toBe(expectedPath);
      
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toBe('Global content');
    });

    it('should handle deeply nested .cursor directories', async () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: path.join(testDir, 'a', 'b', '.cursor', 'c', 'd', 'deep.mdc'),
          relativePath: path.join('a', 'b', '.cursor', 'c', 'd', 'deep.mdc'),
          fileName: 'deep',
          content: 'Deep content'
        }
      ];

      // Act
      const outputPaths = await service.convertFiles(files, testDir);

      // Assert
      const expectedPath = path.join(testDir, 'c2c-rules', 'a', 'b', 'c', 'd', 'deep.md');
      expect(outputPaths[0]).toBe(expectedPath);
      
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toBe('Deep content');
    });

    it('should create c2c-rules directory if it does not exist', async () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: path.join(testDir, '.cursor', 'test.mdc'),
          relativePath: path.join('.cursor', 'test.mdc'),
          fileName: 'test',
          content: 'Test'
        }
      ];

      // Act
      await service.convertFiles(files, testDir);

      // Assert
      const stats = await fs.stat(path.join(testDir, 'c2c-rules'));
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('convertFilesWithSeparateDirectories', () => {
    it('should convert root .cursor files to root c2c-rules directory', async () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: path.join(testDir, '.cursor', 'root.mdc'),
          relativePath: path.join('.cursor', 'root.mdc'),
          fileName: 'root',
          content: 'Root content'
        }
      ];

      // Act
      const outputPaths = await service.convertFilesWithSeparateDirectories(
        files, 
        testDir, 
        path.join(testDir, '.cursor')
      );

      // Assert
      const expectedPath = path.join(testDir, 'c2c-rules', 'root.md');
      expect(outputPaths[0]).toBe(expectedPath);
      
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toBe('Root content');
    });

    it('should convert sub .cursor files to their respective c2c-rules directories', async () => {
      // Arrange
      const subDir = path.join(testDir, 'project1');
      const files: FileInfo[] = [
        {
          originalPath: path.join(subDir, '.cursor', 'project.mdc'),
          relativePath: path.join('project1', '.cursor', 'project.mdc'),
          fileName: 'project',
          content: 'Project content'
        }
      ];

      // Act
      const outputPaths = await service.convertFilesWithSeparateDirectories(
        files,
        testDir,
        path.join(subDir, '.cursor')
      );

      // Assert
      const expectedPath = path.join(subDir, 'c2c-rules', 'project.md');
      expect(outputPaths[0]).toBe(expectedPath);
      
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toBe('Project content');
    });

    it('should handle nested .cursor directories with multiple levels', async () => {
      // Arrange
      const nestedDir = path.join(testDir, 'a', 'b', 'c');
      const files: FileInfo[] = [
        {
          originalPath: path.join(nestedDir, '.cursor', 'sub', 'nested.mdc'),
          relativePath: path.join('a', 'b', 'c', '.cursor', 'sub', 'nested.mdc'),
          fileName: 'nested',
          content: 'Nested content'
        }
      ];

      // Act
      const outputPaths = await service.convertFilesWithSeparateDirectories(
        files,
        testDir,
        path.join(nestedDir, '.cursor')
      );

      // Assert
      const expectedPath = path.join(nestedDir, 'c2c-rules', 'sub', 'nested.md');
      expect(outputPaths[0]).toBe(expectedPath);
      
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toBe('Nested content');
    });
  });
});