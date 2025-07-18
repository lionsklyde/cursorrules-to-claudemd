import { FileConverterService } from '../../../application/services/FileConverterService.js';
import { FileInfo } from '../../../domain/models/FileInfo.js';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('FileConverterService', () => {
  let testDir: string;
  let service: FileConverterService;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `c2c-test-${Date.now()}`);
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
});