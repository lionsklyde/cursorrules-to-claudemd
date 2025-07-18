import { FileSystemUtils } from '../../../infrastructure/utils/FileSystemUtils.js';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('FileSystemUtils', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `c2c-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('findDirectories', () => {
    it('should find target directories recursively', async () => {
      // Arrange
      await fs.mkdir(path.join(testDir, 'project1', '.cursor'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'project2', 'sub', '.cursor'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'project3', '.not-cursor'), { recursive: true });

      // Act
      const result = await FileSystemUtils.findDirectories(testDir, '.cursor');

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toContain(path.join(testDir, 'project1', '.cursor'));
      expect(result).toContain(path.join(testDir, 'project2', 'sub', '.cursor'));
    });

    it('should return empty array when no target directories found', async () => {
      // Act
      const result = await FileSystemUtils.findDirectories(testDir, '.cursor');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findFilesInDirectory', () => {
    it('should find files with specific extension recursively', async () => {
      // Arrange
      const cursorDir = path.join(testDir, '.cursor');
      await fs.mkdir(path.join(cursorDir, 'sub'), { recursive: true });
      await fs.writeFile(path.join(cursorDir, 'rules.mdc'), 'content1');
      await fs.writeFile(path.join(cursorDir, 'sub', 'config.mdc'), 'content2');
      await fs.writeFile(path.join(cursorDir, 'other.txt'), 'content3');

      // Act
      const result = await FileSystemUtils.findFilesInDirectory(cursorDir, '.mdc');

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toContain(path.join(cursorDir, 'rules.mdc'));
      expect(result).toContain(path.join(cursorDir, 'sub', 'config.mdc'));
    });

    it('should return empty array when no files match extension', async () => {
      // Arrange
      const cursorDir = path.join(testDir, '.cursor');
      await fs.mkdir(cursorDir, { recursive: true });
      await fs.writeFile(path.join(cursorDir, 'file.txt'), 'content');

      // Act
      const result = await FileSystemUtils.findFilesInDirectory(cursorDir, '.mdc');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('readFileContent', () => {
    it('should read file content as string', async () => {
      // Arrange
      const filePath = path.join(testDir, 'test.txt');
      const expectedContent = 'Hello, World!';
      await fs.writeFile(filePath, expectedContent);

      // Act
      const content = await FileSystemUtils.readFileContent(filePath);

      // Assert
      expect(content).toBe(expectedContent);
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      // Arrange
      const dirPath = path.join(testDir, 'new', 'nested', 'dir');

      // Act
      await FileSystemUtils.ensureDirectory(dirPath);

      // Assert
      const stats = await fs.stat(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      // Arrange
      const dirPath = path.join(testDir, 'existing');
      await fs.mkdir(dirPath);

      // Act & Assert
      await expect(FileSystemUtils.ensureDirectory(dirPath)).resolves.not.toThrow();
    });
  });

  describe('writeFile', () => {
    it('should write file and create parent directories', async () => {
      // Arrange
      const filePath = path.join(testDir, 'output', 'nested', 'file.txt');
      const content = 'Test content';

      // Act
      await FileSystemUtils.writeFile(filePath, content);

      // Assert
      const readContent = await fs.readFile(filePath, 'utf-8');
      expect(readContent).toBe(content);
    });
  });
});