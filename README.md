# @vooster/c2c - Cursor to Claude Converter

Convert Cursor IDE rules (`.mdc` files) to Claude AI markdown format with intelligent metadata parsing and categorization.

## Installation

```bash
npx @vooster/c2c
```

## Usage

Run the command in any directory containing `.cursor` folders:

```bash
npx @vooster/c2c
```

The tool will:
1. Recursively find all `.cursor` directories
2. Locate all `*.mdc` files within them (including nested subdirectories)
3. Parse metadata (alwaysApply, description, globs) from files
4. Convert them to markdown files in a `c2c-rules` directory (with metadata stripped)
5. Generate an advanced `_root.md` index file with categorized references:
   - Rules that always apply
   - Rules that apply based on description matching
   - Rules that apply based on glob pattern matching

## Example

Given this structure with metadata:
```
project/
├── frontend/
│   └── .cursor/
│       ├── rules.mdc (with alwaysApply: true)
│       └── components/
│           └── ui-rules.mdc (with globs: "**/*.vue")
└── backend/
    └── .cursor/
        └── api/
            └── guidelines.mdc (with description: "API guidelines")
```

Running `npx @vooster/c2c` will create:
```
c2c-rules/
├── _root.md
├── frontend/
│   ├── rules.md
│   └── components/
│       └── ui-rules.md
└── backend/
    └── api/
        └── guidelines.md
```

The `_root.md` will contain:
```markdown
# Cursor Rules Collection

always apply below rules
- rules: @frontend/rules.md

apply below rules if requirement matches
- guidelines
    - description: API guidelines
    - path: @backend/api/guidelines.md

apply below rules if glob pattern matches with related files:
- ui-rules
    - glob: **/*.vue
    - path: @frontend/components/ui-rules.md
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Run in development
pnpm dev
```

## License

MIT