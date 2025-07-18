import { FileConverterService } from '../../../application/services/FileConverterService.js';
import { ParsedCursorRule } from '../../../domain/models/CursorRuleMetadata.js';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('FileConverterService - Metadata handling', () => {
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

  describe('convertParsedFiles', () => {
    it('should convert files with metadata stripped', async () => {
      // Arrange
      const parsedRules: ParsedCursorRule[] = [
        {
          metadata: { alwaysApply: true },
          content: '# Global Rules\n\nThis is the actual content.',
          fileName: 'global',
          relativePath: '.cursor/global.mdc'
        },
        {
          metadata: { description: 'Test rule' },
          content: '## Test Content\n\nNo metadata here.',
          fileName: 'test',
          relativePath: 'project/.cursor/test.mdc'
        }
      ];

      // Act
      const outputPaths = await service.convertParsedFiles(parsedRules, testDir);

      // Assert
      expect(outputPaths).toHaveLength(2);
      
      const content1 = await fs.readFile(outputPaths[0], 'utf-8');
      const content2 = await fs.readFile(outputPaths[1], 'utf-8');
      
      expect(content1).toBe('# Global Rules\n\nThis is the actual content.');
      expect(content2).toBe('## Test Content\n\nNo metadata here.');
      
      // Ensure metadata is not in the files
      expect(content1).not.toContain('alwaysApply');
      expect(content2).not.toContain('description');
    });

    it('should maintain correct file paths', async () => {
      // Arrange
      const parsedRules: ParsedCursorRule[] = [
        {
          metadata: { globs: '**/*.vue' },
          content: 'Vue rules',
          fileName: 'vue-rules',
          relativePath: 'frontend/.cursor/components/vue-rules.mdc'
        }
      ];

      // Act
      const outputPaths = await service.convertParsedFiles(parsedRules, testDir);

      // Assert
      const expectedPath = path.join(testDir, 'c2c-rules', 'frontend', 'components', 'vue-rules.md');
      expect(outputPaths[0]).toBe(expectedPath);
    });
  });
});