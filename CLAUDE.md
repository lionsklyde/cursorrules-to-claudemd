# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development mode
pnpm dev

# Run tests
pnpm test

# Run specific test file
pnpm test src/__tests__/application/services/FileExplorerService.test.ts

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Publish to npm
pnpm publish:npm
```

## Architecture Overview

This project converts Cursor IDE rule files (`.mdc`) to Claude AI-compatible markdown using a **Layered Architecture**:

1. **Presentation Layer** (`src/presentation/`): CLI interface using Commander.js
2. **Application Layer** (`src/application/services/`): Core business logic
   - `FileExplorerService`: Recursively finds `.cursor` directories and `.mdc` files
   - `MetadataParserService`: Extracts YAML frontmatter from `.mdc` files
   - `FileConverterService`: Converts files and strips metadata, manages output directories
   - `AdvancedRootFileGeneratorService`: Generates categorized `_root.md` index
   - `ClaudeMdService`: Updates or creates CLAUDE.md files with `<c2c-rules>` sections
3. **Domain Layer** (`src/domain/models/`): Type definitions for `FileInfo` and `CursorRuleMetadata`
4. **Infrastructure Layer** (`src/infrastructure/utils/`): File system operations

## Key Implementation Details

### Metadata Format
`.mdc` files contain YAML frontmatter:
```yaml
---
alwaysApply: true      # Rule always applies
description: string    # Rule description for matching
globs: string         # Glob pattern for file matching
---
```

### Rule Categorization Priority
Rules are categorized by priority: `alwaysApply` > `description` > `globs`

### Output Structure
- Creates `c2c-rules/` directories next to each `.cursor` directory
- Preserves original directory structure
- Generates `_root.md` with categorized references using relative paths
- Updates or creates `CLAUDE.md` files with `<c2c-rules>` sections

### Testing Strategy
- TDD approach with Jest
- Test files mirror source structure in `__tests__/`
- Use temporary directories with unique names to avoid race conditions
- Clean up test artifacts in `afterEach` hooks
- All 58 tests pass reliably without flaky failures

## Important Patterns

1. **Service Dependencies**: Services are instantiated in CLI and passed data, not injected
2. **Path Handling**: Use `path.sep` for cross-platform compatibility
3. **Async Operations**: All file operations use `promises` API from `fs`
4. **Error Handling**: Graceful fallback when metadata parsing fails
5. **Console Output**: Services log progress directly to console

## Testing Individual Components

```bash
# Test a specific service
pnpm test MetadataParserService

# Test with pattern matching
pnpm test --testNamePattern="should parse metadata"
```

## Domain Knowledge

The tool bridges Cursor IDE's rule system with Claude AI's context understanding. Key transformations:
1. Extracts metadata to categorize rules by priority (alwaysApply → description → globs)
2. Strips metadata from content for clean markdown output
3. Generates structured index for Claude to understand rule applicability
4. Creates separate `c2c-rules` directories for each `.cursor` directory
5. Automatically maintains `CLAUDE.md` files with proper rule references

## Recent Updates

- Fixed race condition in test suite by adding unique suffixes to temporary directories
- All tests now pass reliably (58 tests, 9 test suites)
- Updated to use `slice()` instead of deprecated `substr()` method
- Improved test isolation to prevent ENOENT errors during parallel test execution

## TDD Requirements

@claude-rules/tdd.md