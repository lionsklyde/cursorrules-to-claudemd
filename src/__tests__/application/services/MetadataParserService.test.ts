import { MetadataParserService } from '../../../application/services/MetadataParserService.js';
import { FileInfo } from '../../../domain/models/FileInfo.js';

describe('MetadataParserService', () => {
  let service: MetadataParserService;

  beforeEach(() => {
    service = new MetadataParserService();
  });

  describe('parseFiles', () => {
    it('should parse metadata from cursor rule files', () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: '/test/project/.cursor/rules.mdc',
          relativePath: 'project/.cursor/rules.mdc',
          fileName: 'rules',
          content: `---
description: Basic coding rules
alwaysApply: false
---

# Basic Rules

This is the content of the rules.`
        }
      ];

      // Act
      const result = service.parseFiles(files);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].metadata).toEqual({
        description: 'Basic coding rules',
        alwaysApply: false
      });
      expect(result[0].content).toBe('# Basic Rules\n\nThis is the content of the rules.');
      expect(result[0].fileName).toBe('rules');
    });

    it('should parse files with globs metadata', () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: '/test/.cursor/vue-rules.mdc',
          relativePath: '.cursor/vue-rules.mdc',
          fileName: 'vue-rules',
          content: `---
globs: "**/*.vue"
---

Vue specific rules`
        }
      ];

      // Act
      const result = service.parseFiles(files);

      // Assert
      expect(result[0].metadata).toEqual({
        globs: '**/*.vue'
      });
      expect(result[0].content).toBe('Vue specific rules');
    });

    it('should handle files without metadata', () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: '/test/.cursor/plain.mdc',
          relativePath: '.cursor/plain.mdc',
          fileName: 'plain',
          content: 'Just plain content without metadata'
        }
      ];

      // Act
      const result = service.parseFiles(files);

      // Assert
      expect(result[0].metadata).toEqual({});
      expect(result[0].content).toBe('Just plain content without metadata');
    });

    it('should parse alwaysApply true metadata', () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: '/test/.cursor/global.mdc',
          relativePath: '.cursor/global.mdc',
          fileName: 'global',
          content: `---
alwaysApply: true
---

Global rules that always apply`
        }
      ];

      // Act
      const result = service.parseFiles(files);

      // Assert
      expect(result[0].metadata).toEqual({
        alwaysApply: true
      });
    });

    it('should handle malformed metadata gracefully', () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: '/test/.cursor/malformed.mdc',
          relativePath: '.cursor/malformed.mdc',
          fileName: 'malformed',
          content: `---
description: Missing closing
# Content starts here`
        }
      ];

      // Act
      const result = service.parseFiles(files);

      // Assert
      expect(result[0].metadata).toEqual({});
      expect(result[0].content).toBe(`---
description: Missing closing
# Content starts here`);
    });

    it('should preserve all fields when parsing multiple files', () => {
      // Arrange
      const files: FileInfo[] = [
        {
          originalPath: '/test/p1/.cursor/r1.mdc',
          relativePath: 'p1/.cursor/r1.mdc',
          fileName: 'r1',
          content: `---
alwaysApply: true
---
Rule 1`
        },
        {
          originalPath: '/test/p2/.cursor/r2.mdc',
          relativePath: 'p2/.cursor/r2.mdc',
          fileName: 'r2',
          content: `---
description: Rule 2 desc
---
Rule 2`
        }
      ];

      // Act
      const result = service.parseFiles(files);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].relativePath).toBe('p1/.cursor/r1.mdc');
      expect(result[1].relativePath).toBe('p2/.cursor/r2.mdc');
    });
  });
});