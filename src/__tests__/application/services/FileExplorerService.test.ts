import { FileExplorerService } from '../../../application/services/FileExplorerService.js';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('FileExplorerService', () => {
  let testDir: string;
  let service: FileExplorerService;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `c2c-test-${Date.now()}`);
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
});