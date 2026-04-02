# Contributing to MCP Dependency Scanner

Thank you for considering contributing to MCP Dependency Scanner! This document provides guidelines for contributing to this project.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Setup Development Environment

```bash
npm install
npm run build
```

### Running in Development Mode

```bash
npm run dev
```

### Code Quality

Before submitting a PR, ensure:

1. **TypeScript compiles without errors**:
   ```bash
   npm run build
   ```

2. **Code passes linting**:
   ```bash
   npm run lint
   ```

3. **Fix linting issues**:
   ```bash
   npm run lint:fix
   ```

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Use meaningful variable and function names
- Keep functions focused and small

### TypeScript Guidelines

- Prefer `interface` over `type` for object shapes
- Use `enum` for fixed sets of values
- Avoid `any` type - use `unknown` if type is truly unknown
- Export types that might be useful for consumers

### Error Handling

- Always use try-catch for async operations
- Provide meaningful error messages
- Include context in error messages
- Don't swallow errors silently

## Project Structure

```
src/
├── index.ts              # MCP server entry point
├── scanner.ts            # Main orchestration logic
├── types.ts              # Type definitions
├── scanners/             # Language-specific scanners
│   ├── npmScanner.ts
│   └── pythonScanner.ts
└── utils/                # Shared utilities
    └── projectDetector.ts
```

## Adding New Features

### Adding a New Scanner

1. Create scanner in `src/scanners/`
2. Implement scanner interface returning `ScanResult`
3. Update `ProjectType` enum in `types.ts`
4. Add detection logic in `projectDetector.ts`
5. Integrate in `scanner.ts`
6. Update README with new capabilities

### Adding Alternative Package Suggestions

Update the `alternativesMap` in the relevant scanner file:

```typescript
const alternativesMap: Record<string, string[]> = {
  'vulnerable-package': ['safe-alternative-1', 'safe-alternative-2'],
};
```

## Testing

When adding new features:
- Test with real projects
- Test error cases
- Verify cross-platform compatibility (Windows, macOS, Linux)

## Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Maintenance tasks

Example:
```
feat: add support for Yarn package manager
fix: handle missing package.json gracefully
docs: update installation instructions
```

## Pull Request Process

1. Update README.md with details of changes if applicable
2. Update CHANGELOG.md following the existing format
3. Ensure all checks pass
4. Request review from maintainers
5. Address review feedback

## Release Process

Maintainers will handle releases:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase
- General feedback

Thank you for contributing! 🎉
