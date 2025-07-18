export interface CursorRuleMetadata {
  description?: string;
  globs?: string;
  alwaysApply?: boolean;
}

export interface ParsedCursorRule {
  metadata: CursorRuleMetadata;
  content: string;
  fileName: string;
  relativePath: string;
}