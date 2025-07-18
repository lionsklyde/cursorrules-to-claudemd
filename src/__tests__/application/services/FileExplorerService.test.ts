import { FileExplorerService } from '../../../application/services/FileExplorerService.js';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('FileExplorerService', () => {
  let testDir: string;
  let service: FileExplorerService;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `c2c-test-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);
    await fs.mkdir(testDir, { recursive: true });
    service = new FileExplorerService();
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('findMdcFiles', () => {
    it('should find mdc files in .cursor directories', async () => {
      // Arrange
      const cursorDir1 = path.join(testDir, 'project1', '.cursor');
      const cursorDir2 = path.join(testDir, 'project2', '.cursor', 'sub');
      
      await fs.mkdir(cursorDir1, { recursive: true });
      await fs.mkdir(cursorDir2, { recursive: true });
      
      await fs.writeFile(path.join(cursorDir1, 'rules.mdc'), 'Rule content');
      await fs.writeFile(path.join(cursorDir2, 'config.mdc'), 'Config content');
      await fs.writeFile(path.join(cursorDir1, 'readme.txt'), 'Should not be found');

      // Act
      const result = await service.findMdcFiles(testDir);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        fileName: 'rules',
        content: 'Rule content',
        relativePath: path.join('project1', '.cursor', 'rules.mdc')
      });
      expect(result[1]).toMatchObject({
        fileName: 'config',
        content: 'Config content',
        relativePath: path.join('project2', '.cursor', 'sub', 'config.mdc')
      });
    });

    it('should return empty array when no .cursor directories exist', async () => {
      // Act
      const result = await service.findMdcFiles(testDir);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when .cursor directories have no mdc files', async () => {
      // Arrange
      const cursorDir = path.join(testDir, '.cursor');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(path.join(cursorDir, 'other.txt'), 'content');

      // Act
      const result = await service.findMdcFiles(testDir);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle nested .cursor directories correctly', async () => {
      // Arrange
      const deepCursorDir = path.join(testDir, 'a', 'b', 'c', '.cursor', 'd', 'e');
      await fs.mkdir(deepCursorDir, { recursive: true });
      await fs.writeFile(path.join(deepCursorDir, 'deep.mdc'), 'Deep content');

      // Act
      const result = await service.findMdcFiles(testDir);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        fileName: 'deep',
        content: 'Deep content',
        relativePath: path.join('a', 'b', 'c', '.cursor', 'd', 'e', 'deep.mdc')
      });
    });
  });

  describe('findRootCursorDirectory', () => {
    it('should find only root level .cursor directory', async () => {
      // Arrange
      const rootCursorDir = path.join(testDir, '.cursor');
      const subCursorDir = path.join(testDir, 'project', '.cursor');
      
      await fs.mkdir(rootCursorDir, { recursive: true });
      await fs.mkdir(subCursorDir, { recursive: true });
      
      await fs.writeFile(path.join(rootCursorDir, 'root.mdc'), 'Root content');
      await fs.writeFile(path.join(subCursorDir, 'sub.mdc'), 'Sub content');

      // Act
      const result = await service.findRootCursorDirectory(testDir);

      // Assert
      expect(result).toBeDefined();
      expect(result).toBe(rootCursorDir);
    });

    it('should return null when no root .cursor directory exists', async () => {
      // Arrange
      const subCursorDir = path.join(testDir, 'project', '.cursor');
      await fs.mkdir(subCursorDir, { recursive: true });

      // Act
      const result = await service.findRootCursorDirectory(testDir);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findSubCursorDirectories', () => {
    it('should find only subdirectory .cursor directories with .mdc files', async () => {
      // Arrange
      const rootCursorDir = path.join(testDir, '.cursor');
      const subCursorDir1 = path.join(testDir, 'project1', '.cursor');
      const subCursorDir2 = path.join(testDir, 'project2', '.cursor');
      const subCursorDir3 = path.join(testDir, 'project3', '.cursor'); // No .mdc files
      
      await fs.mkdir(rootCursorDir, { recursive: true });
      await fs.mkdir(subCursorDir1, { recursive: true });
      await fs.mkdir(subCursorDir2, { recursive: true });
      await fs.mkdir(subCursorDir3, { recursive: true });
      
      await fs.writeFile(path.join(rootCursorDir, 'root.mdc'), 'Root content');
      await fs.writeFile(path.join(subCursorDir1, 'sub1.mdc'), 'Sub1 content');
      await fs.writeFile(path.join(subCursorDir2, 'sub2.mdc'), 'Sub2 content');
      await fs.writeFile(path.join(subCursorDir3, 'readme.txt'), 'Not mdc');

      // Act
      const result = await service.findSubCursorDirectories(testDir);

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toContain(subCursorDir1);
      expect(result).toContain(subCursorDir2);
      expect(result).not.toContain(rootCursorDir);
      expect(result).not.toContain(subCursorDir3);
    });

    it('should find nested .cursor directories with .mdc files', async () => {
      // Arrange
      const nestedCursorDir = path.join(testDir, 'a', 'b', 'c', '.cursor');
      await fs.mkdir(nestedCursorDir, { recursive: true });
      await fs.writeFile(path.join(nestedCursorDir, 'nested.mdc'), 'Nested content');

      // Act
      const result = await service.findSubCursorDirectories(testDir);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(nestedCursorDir);
    });
  });

  describe('findMdcFilesInDirectory', () => {
    it('should find mdc files in a specific cursor directory', async () => {
      // Arrange
      const cursorDir = path.join(testDir, 'project', '.cursor');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(path.join(cursorDir, 'file1.mdc'), 'Content 1');
      await fs.writeFile(path.join(cursorDir, 'file2.mdc'), 'Content 2');
      await fs.writeFile(path.join(cursorDir, 'other.txt'), 'Not mdc');

      // Act
      const result = await service.findMdcFilesInDirectory(cursorDir, testDir);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        fileName: 'file1',
        content: 'Content 1',
        relativePath: path.join('project', '.cursor', 'file1.mdc')
      });
      expect(result[1]).toMatchObject({
        fileName: 'file2',
        content: 'Content 2',
        relativePath: path.join('project', '.cursor', 'file2.mdc')
      });
    });
  });
});