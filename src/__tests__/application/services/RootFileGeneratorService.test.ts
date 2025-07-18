import { RootFileGeneratorService } from '../../../application/services/RootFileGeneratorService.js';
import { FileInfo } from '../../../domain/models/FileInfo.js';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('RootFileGeneratorService', () => {
  let testDir: string;
  let service: RootFileGeneratorService;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `c2c-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    service = new RootFileGeneratorService();
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('generateRootFile', () => {
    it('should generate root file with correct structure', async () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: path.join(testDir, 'project1', '.cursor', 'rules.mdc'),
          relativePath: path.join('project1', '.cursor', 'rules.mdc'),
          fileName: 'rules',
          content: 'Rule content'
        },
        {
          originalPath: path.join(testDir, 'project1', '.cursor', 'components', 'ui-rules.mdc'),
          relativePath: path.join('project1', '.cursor', 'components', 'ui-rules.mdc'),
          fileName: 'ui-rules',
          content: 'UI Rules'
        },
        {
          originalPath: path.join(testDir, 'project2', '.cursor', 'config.mdc'),
          relativePath: path.join('project2', '.cursor', 'config.mdc'),
          fileName: 'config',
          content: 'Config content'
        }
      ];

      // Act
      await service.generateRootFile(files, testDir);

      // Assert
      const rootPath = path.join(testDir, 'c2c-rules', '_root.md');
      const content = await fs.readFile(rootPath, 'utf-8');
      
      expect(content).toContain('# Cursor Rules Collection');
      expect(content).toContain('## Files');
      expect(content).toContain('### project1');
      expect(content).toContain('- rules: @project1/rules.md');
      expect(content).toContain('- components/ui-rules: @project1/components/ui-rules.md');
      expect(content).toContain('### project2');
      expect(content).toContain('- config: @project2/config.md');
      expect(content).toContain('Total files: 3');
    });

    it('should handle files without project directory', async () => {
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
      await service.generateRootFile(files, testDir);

      // Assert
      const rootPath = path.join(testDir, 'c2c-rules', '_root.md');
      const content = await fs.readFile(rootPath, 'utf-8');
      
      expect(content).toContain('### root');
      expect(content).toContain('- global: @global.md');
    });

    it('should handle deeply nested files correctly', async () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: path.join(testDir, 'deep', 'project', '.cursor', 'sub1', 'sub2', 'nested.mdc'),
          relativePath: path.join('deep', 'project', '.cursor', 'sub1', 'sub2', 'nested.mdc'),
          fileName: 'nested',
          content: 'Nested content'
        }
      ];

      // Act
      await service.generateRootFile(files, testDir);

      // Assert
      const rootPath = path.join(testDir, 'c2c-rules', '_root.md');
      const content = await fs.readFile(rootPath, 'utf-8');
      
      expect(content).toContain('### project');
      expect(content).toContain('- sub1/sub2/nested: @deep/project/sub1/sub2/nested.md');
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
      await service.generateRootFile(files, testDir);

      // Assert
      const stats = await fs.stat(path.join(testDir, 'c2c-rules'));
      expect(stats.isDirectory()).toBe(true);
    });
  });
});