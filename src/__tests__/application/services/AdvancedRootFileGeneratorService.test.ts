import { AdvancedRootFileGeneratorService } from "../../../application/services/AdvancedRootFileGeneratorService.js";
import { ParsedCursorRule } from "../../../domain/models/CursorRuleMetadata.js";
import { promises as fs } from "fs";
import path from "path";
import { tmpdir } from "os";

describe("AdvancedRootFileGeneratorService", () => {
  let testDir: string;
  let service: AdvancedRootFileGeneratorService;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `c2c-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    service = new AdvancedRootFileGeneratorService();
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("generateRootFile", () => {
    it("should generate root file with alwaysApply rules", async () => {
      // Arrange
      const rules: ParsedCursorRule[] = [
        {
          metadata: { alwaysApply: true },
          content: "Global rule content",
          fileName: "global-rule",
          relativePath: "project/.cursor/global-rule.mdc",
        },
        {
          metadata: { alwaysApply: true },
          content: "Another global rule",
          fileName: "another-global",
          relativePath: ".cursor/another-global.mdc",
        },
      ];

      // Act
      await service.generateRootFile(rules, testDir);

      // Assert
      const rootPath = path.join(testDir, "c2c-rules", "_root.md");
      const content = await fs.readFile(rootPath, "utf-8");

      expect(content).toContain("@project/global-rule.md");
      expect(content).toContain("@another-global.md");
    });

    it("should generate root file with description rules", async () => {
      // Arrange
      const rules: ParsedCursorRule[] = [
        {
          metadata: { description: "React component rules" },
          content: "React rules content",
          fileName: "react-rules",
          relativePath: "frontend/.cursor/react-rules.mdc",
        },
        {
          metadata: { description: "API endpoint guidelines" },
          content: "API rules",
          fileName: "api-guide",
          relativePath: "backend/.cursor/api/api-guide.mdc",
        },
      ];

      // Act
      await service.generateRootFile(rules, testDir);

      // Assert
      const rootPath = path.join(testDir, "c2c-rules", "_root.md");
      const content = await fs.readFile(rootPath, "utf-8");

      expect(content).toContain("frontend/react-rules.md");
      expect(content).toContain("backend/api/api-guide.md");
    });

    it("should generate root file with glob rules", async () => {
      // Arrange
      const rules: ParsedCursorRule[] = [
        {
          metadata: { globs: "**/*.vue" },
          content: "Vue rules",
          fileName: "vue-rules",
          relativePath: ".cursor/vue-rules.mdc",
        },
        {
          metadata: { globs: "src/**/*.test.ts" },
          content: "Test rules",
          fileName: "test-rules",
          relativePath: "project/.cursor/test-rules.mdc",
        },
      ];

      // Act
      await service.generateRootFile(rules, testDir);

      // Assert
      const rootPath = path.join(testDir, "c2c-rules", "_root.md");
      const content = await fs.readFile(rootPath, "utf-8");

      expect(content).toContain("vue-rules.md");
      expect(content).toContain("project/test-rules.md");
    });

    it("should handle mixed rule types with correct priority", async () => {
      // Arrange
      const rules: ParsedCursorRule[] = [
        {
          metadata: {
            alwaysApply: true,
            description: "Should use alwaysApply",
            globs: "**/*.js",
          },
          content: "Priority test",
          fileName: "priority-rule",
          relativePath: ".cursor/priority-rule.mdc",
        },
        {
          metadata: {
            description: "Should use description",
            globs: "**/*.css",
          },
          content: "Description priority",
          fileName: "desc-rule",
          relativePath: ".cursor/desc-rule.mdc",
        },
        {
          metadata: { globs: "**/*.md" },
          content: "Glob only",
          fileName: "glob-rule",
          relativePath: ".cursor/glob-rule.mdc",
        },
      ];

      // Act
      await service.generateRootFile(rules, testDir);

      // Assert
      const rootPath = path.join(testDir, "c2c-rules", "_root.md");
      const content = await fs.readFile(rootPath, "utf-8");

      // Check priority-rule appears in alwaysApply section
      const priorityRuleIndex = content.indexOf("priority-rule");
      const descRuleIndex = content.indexOf("desc-rule");
      const globRuleIndex = content.indexOf("glob-rule");

      expect(priorityRuleIndex).toBeLessThan(descRuleIndex);
      expect(descRuleIndex).toBeLessThan(globRuleIndex);
    });

    it("should handle rules without metadata", async () => {
      // Arrange
      const rules: ParsedCursorRule[] = [
        {
          metadata: {},
          content: "Plain content",
          fileName: "plain-rule",
          relativePath: ".cursor/plain-rule.mdc",
        },
      ];

      // Act
      await service.generateRootFile(rules, testDir);

      // Assert
      const rootPath = path.join(testDir, "c2c-rules", "_root.md");
      const content = await fs.readFile(rootPath, "utf-8");

      // Should not appear in any categorized section
      expect(content).not.toContain("plain-rule");
    });

    it("should handle empty rules array", async () => {
      // Arrange
      const rules: ParsedCursorRule[] = [];

      // Act
      await service.generateRootFile(rules, testDir);

      // Assert
      const rootPath = path.join(testDir, "c2c-rules", "_root.md");
      const content = await fs.readFile(rootPath, "utf-8");

      expect(content).toContain("# Rules Collection");
      expect(content).not.toContain("always apply below rules");
      expect(content).not.toContain("apply below rules if requirement matches");
      expect(content).not.toContain(
        "apply below rules if glob pattern matches"
      );
    });
  });

  describe("generateRootFileForDirectory", () => {
    it("should generate root file for a specific cursor directory", async () => {
      // Arrange
      const rules: ParsedCursorRule[] = [
        {
          metadata: { alwaysApply: true },
          content: "Project specific rule",
          fileName: "project-rule",
          relativePath: "project/.cursor/project-rule.mdc",
        },
      ];
      const cursorDir = path.join(testDir, "project", ".cursor");
      const outputDir = path.join(testDir, "project", "c2c-rules");

      // Act
      await service.generateRootFileForDirectory(rules, cursorDir, outputDir);

      // Assert
      const rootPath = path.join(outputDir, "_root.md");
      const content = await fs.readFile(rootPath, "utf-8");

      expect(content).toContain("@project-rule.md");
      expect(content).toContain("# Rules Collection");
    });

    it("should generate root file for root cursor directory", async () => {
      // Arrange
      const rules: ParsedCursorRule[] = [
        {
          metadata: { description: "Global rule for all projects" },
          content: "Global rule content",
          fileName: "global-rule",
          relativePath: ".cursor/global-rule.mdc",
        },
      ];
      const cursorDir = path.join(testDir, ".cursor");
      const outputDir = path.join(testDir, "c2c-rules");

      // Act
      await service.generateRootFileForDirectory(rules, cursorDir, outputDir);

      // Assert
      const rootPath = path.join(outputDir, "_root.md");
      const content = await fs.readFile(rootPath, "utf-8");

      expect(content).toContain("global-rule.md");
      expect(content).toContain("Global rule for all projects");
    });

    it("should generate root file with proper relative paths for nested directories", async () => {
      // Arrange
      const rules: ParsedCursorRule[] = [
        {
          metadata: { globs: "**/*.tsx" },
          content: "React component rules",
          fileName: "react-rules",
          relativePath: "frontend/components/.cursor/sub/react-rules.mdc",
        },
      ];
      const cursorDir = path.join(testDir, "frontend", "components", ".cursor");
      const outputDir = path.join(testDir, "frontend", "components", "c2c-rules");

      // Act
      await service.generateRootFileForDirectory(rules, cursorDir, outputDir);

      // Assert
      const rootPath = path.join(outputDir, "_root.md");
      const content = await fs.readFile(rootPath, "utf-8");

      expect(content).toContain("sub/react-rules.md");
      expect(content).toContain("**/*.tsx");
    });
  });
});
