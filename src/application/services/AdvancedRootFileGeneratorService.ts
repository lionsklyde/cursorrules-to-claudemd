import path from "path";
import { ParsedCursorRule } from "../../domain/models/CursorRuleMetadata.js";
import { FileSystemUtils } from "../../infrastructure/utils/FileSystemUtils.js";

export class AdvancedRootFileGeneratorService {
  private readonly outputDir = "c2c-rules";

  async generateRootFile(
    rules: ParsedCursorRule[],
    rootPath: string
  ): Promise<void> {
    const rootFilePath = path.join(rootPath, this.outputDir, "_root.md");
    const content = this.buildAdvancedRootContent(rules);

    await FileSystemUtils.writeFile(rootFilePath, content);
    console.log(`✓ Generated ${path.relative(rootPath, rootFilePath)}`);
  }

  private buildAdvancedRootContent(rules: ParsedCursorRule[]): string {
    const alwaysApplyRules = rules.filter(
      (r) => r.metadata.alwaysApply === true
    );
    const descriptionRules = rules.filter(
      (r) => r.metadata.alwaysApply !== true && r.metadata.description
    );
    const globRules = rules.filter(
      (r) =>
        r.metadata.alwaysApply !== true &&
        !r.metadata.description &&
        r.metadata.globs
    );

    let content = "# Cursor Rules Collection\n\n";

    // Always Apply section
    if (alwaysApplyRules.length > 0) {
      content +=
        "you MUST read below files and STRICTLY FOLLOW as guidelines: \n";
      alwaysApplyRules.forEach((rule) => {
        const linkPath = this.getLinkPath(rule.relativePath);
        content += `- ${rule.fileName}: @${linkPath}\n`;
      });
      content += "\n";
    }

    // Description section
    if (descriptionRules.length > 0) {
      content +=
        "read below rules if description matches with your requirement:\n";
      descriptionRules.forEach((rule) => {
        const linkPath = this.getLinkPath(rule.relativePath);
        content += `- ${rule.fileName}\n`;
        content += `    - description: ${rule.metadata.description}\n`;
        content += `    - path: ${linkPath}\n`;
      });
      content += "\n";
    }

    // Glob section
    if (globRules.length > 0) {
      content +=
        "read below rules if glob pattern matches with requirement related files:\n";
      globRules.forEach((rule) => {
        const linkPath = this.getLinkPath(rule.relativePath);
        const globPattern = rule.metadata.globs!;
        content += `- ${rule.fileName}\n`;
        content += `    - glob: ${globPattern}\n`;
        content += `    - path: ${linkPath}\n`;
      });
      content += "\n";
    }

    return content.trim();
  }

  private getLinkPath(relativePath: string): string {
    const parts = relativePath.split(path.sep);
    const cursorIndex = parts.indexOf(".cursor");

    if (cursorIndex !== -1) {
      const projectParts = parts.slice(0, cursorIndex);
      const afterCursor = parts.slice(cursorIndex + 1);
      const combined = [...projectParts, ...afterCursor];

      return combined.join("/").replace(".mdc", ".md");
    }

    return relativePath.replace(".mdc", ".md");
  }
}
