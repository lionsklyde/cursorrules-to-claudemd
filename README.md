# @vooster/c2c - Cursor to Claude Converter

Convert Cursor IDE rules (`.mdc` files) to Claude AI markdown format.

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
3. Convert them to markdown files in a `c2c-rules` directory
4. Generate a `_root.md` index file with references to all converted files

## Example

Given this structure:
```
project/
├── frontend/
│   └── .cursor/
│       ├── rules.mdc
│       └── components/
│           └── ui-rules.mdc
└── backend/
    └── .cursor/
        └── api/
            └── guidelines.mdc
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