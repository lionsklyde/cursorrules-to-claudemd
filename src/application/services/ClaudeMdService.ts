import path from 'path';
import { promises as fs } from 'fs';

export class ClaudeMdService {
  async updateClaudeMdFile(directoryPath: string): Promise<void> {
    const claudeMdPath = path.join(directoryPath, 'CLAUDE.md');
    
    let content = '';
    
    try {
      const existingContent = await fs.readFile(claudeMdPath, 'utf-8');
      content = existingContent;
    } catch (error) {
      // File doesn't exist, will create new one
      content = '';
    }
    
    // Remove existing c2c-rules sections
    content = this.removeExistingC2cRulesSections(content);
    
    // Add new c2c-rules section
    const newC2cRulesSection = this.buildC2cRulesSection();
    content = this.appendC2cRulesSection(content, newC2cRulesSection);
    
    await fs.writeFile(claudeMdPath, content);
    console.log(`✓ Updated ${path.relative(process.cwd(), claudeMdPath)}`);
  }
  
  private removeExistingC2cRulesSections(content: string): string {
    // Remove all c2c-rules sections using regex
    const c2cRulesRegex = /<c2c-rules>[\s\S]*?<\/c2c-rules>/g;
    return content.replace(c2cRulesRegex, '');
  }
  
  private buildC2cRulesSection(): string {
    return `<c2c-rules>
- @c2c-rules/_root.md
</c2c-rules>`;
  }
  
  private appendC2cRulesSection(content: string, c2cRulesSection: string): string {
    // Trim whitespace from content
    const trimmedContent = content.trim();
    
    if (trimmedContent === '') {
      return c2cRulesSection;
    }
    
    return `${trimmedContent}

${c2cRulesSection}`;
  }
}