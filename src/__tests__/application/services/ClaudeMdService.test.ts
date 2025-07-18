import { ClaudeMdService } from '../../../application/services/ClaudeMdService.js';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('ClaudeMdService', () => {
  let testDir: string;
  let service: ClaudeMdService;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `c2c-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    service = new ClaudeMdService();
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('updateClaudeMdFile', () => {
    it('should create CLAUDE.md file if it does not exist', async () => {
      // Act
      await service.updateClaudeMdFile(testDir);

      // Assert
      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      const exists = await fs.access(claudeMdPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(claudeMdPath, 'utf-8');
      expect(content).toContain('<c2c-rules>');
      expect(content).toContain('- @c2c-rules/_root.md');
      expect(content).toContain('</c2c-rules>');
    });

    it('should add c2c-rules section to existing CLAUDE.md without c2c-rules section', async () => {
      // Arrange
      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      const existingContent = `# CLAUDE.md

This is an existing CLAUDE.md file.

## Some section

Some content here.`;

      await fs.writeFile(claudeMdPath, existingContent);

      // Act
      await service.updateClaudeMdFile(testDir);

      // Assert
      const content = await fs.readFile(claudeMdPath, 'utf-8');
      expect(content).toContain(existingContent);
      expect(content).toContain('<c2c-rules>');
      expect(content).toContain('- @c2c-rules/_root.md');
      expect(content).toContain('</c2c-rules>');
      expect(content.indexOf('<c2c-rules>')).toBeGreaterThan(content.indexOf('Some content here.'));
    });

    it('should replace existing c2c-rules section in CLAUDE.md', async () => {
      // Arrange
      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      const existingContent = `# CLAUDE.md

This is an existing CLAUDE.md file.

<c2c-rules>
- @old-rules/_root.md
- @another-old-rule.md
</c2c-rules>

## Some section

Some content here.`;

      await fs.writeFile(claudeMdPath, existingContent);

      // Act
      await service.updateClaudeMdFile(testDir);

      // Assert
      const content = await fs.readFile(claudeMdPath, 'utf-8');
      expect(content).toContain('This is an existing CLAUDE.md file.');
      expect(content).toContain('Some content here.');
      expect(content).toContain('<c2c-rules>');
      expect(content).toContain('- @c2c-rules/_root.md');
      expect(content).toContain('</c2c-rules>');
      expect(content).not.toContain('old-rules');
      expect(content).not.toContain('another-old-rule');
    });

    it('should handle multiple c2c-rules sections and replace all of them', async () => {
      // Arrange
      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      const existingContent = `# CLAUDE.md

<c2c-rules>
- @first-old-rule.md
</c2c-rules>

Some content in between.

<c2c-rules>
- @second-old-rule.md
</c2c-rules>

End content.`;

      await fs.writeFile(claudeMdPath, existingContent);

      // Act
      await service.updateClaudeMdFile(testDir);

      // Assert
      const content = await fs.readFile(claudeMdPath, 'utf-8');
      expect(content).toContain('Some content in between.');
      expect(content).toContain('End content.');
      expect(content).toContain('<c2c-rules>');
      expect(content).toContain('- @c2c-rules/_root.md');
      expect(content).toContain('</c2c-rules>');
      expect(content).not.toContain('first-old-rule');
      expect(content).not.toContain('second-old-rule');
      
      // Should have only one c2c-rules section
      const matches = content.match(/<c2c-rules>/g);
      expect(matches).toHaveLength(1);
    });

    it('should handle c2c-rules section with different whitespace and formatting', async () => {
      // Arrange
      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      const existingContent = `# CLAUDE.md

Some content.

<c2c-rules>


- @old-rule.md
  - @nested-rule.md


</c2c-rules>

More content.`;

      await fs.writeFile(claudeMdPath, existingContent);

      // Act
      await service.updateClaudeMdFile(testDir);

      // Assert
      const content = await fs.readFile(claudeMdPath, 'utf-8');
      expect(content).toContain('Some content.');
      expect(content).toContain('More content.');
      expect(content).toContain('<c2c-rules>');
      expect(content).toContain('- @c2c-rules/_root.md');
      expect(content).toContain('</c2c-rules>');
      expect(content).not.toContain('old-rule');
      expect(content).not.toContain('nested-rule');
    });

    it('should append c2c-rules section at the end of file', async () => {
      // Arrange
      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      const existingContent = `# CLAUDE.md

This is existing content.

## Last section

Last content.`;

      await fs.writeFile(claudeMdPath, existingContent);

      // Act
      await service.updateClaudeMdFile(testDir);

      // Assert
      const content = await fs.readFile(claudeMdPath, 'utf-8');
      expect(content.endsWith('</c2c-rules>')).toBe(true);
      expect(content.indexOf('Last content.')).toBeLessThan(content.indexOf('<c2c-rules>'));
    });

    it('should handle empty CLAUDE.md file', async () => {
      // Arrange
      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      await fs.writeFile(claudeMdPath, '');

      // Act
      await service.updateClaudeMdFile(testDir);

      // Assert
      const content = await fs.readFile(claudeMdPath, 'utf-8');
      expect(content).toBe(`<c2c-rules>
- @c2c-rules/_root.md
</c2c-rules>`);
    });

    it('should handle CLAUDE.md file with only whitespace', async () => {
      // Arrange
      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      await fs.writeFile(claudeMdPath, '   \n\n  \t  \n');

      // Act
      await service.updateClaudeMdFile(testDir);

      // Assert
      const content = await fs.readFile(claudeMdPath, 'utf-8');
      expect(content).toBe(`<c2c-rules>
- @c2c-rules/_root.md
</c2c-rules>`);
    });
  });
});