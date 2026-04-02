# MCP Dependency Scanner

A production-grade Model Context Protocol (MCP) server for scanning JavaScript/TypeScript and Python projects for dependency vulnerabilities. This tool helps LLMs provide intelligent security recommendations by detecting vulnerable packages and suggesting safer alternatives.

## Features

- 🔍 **Multi-Language Support**: Scans JavaScript/TypeScript (using `npm audit`) and Python (using `pip-audit`) projects
- 🎯 **Intelligent Detection**: Automatically detects project type and package managers
- 🚨 **Severity Classification**: Categorizes vulnerabilities by severity (Critical, High, Moderate, Low, Info)
- 💡 **Smart Recommendations**: Suggests alternative packages for vulnerable dependencies
- 📊 **Flexible Output**: Supports detailed reports, summaries, and JSON formats
- 🔒 **Production Ready**: Comprehensive error handling, TypeScript strict mode, and extensive validation

## Installation

### As a Global Package

```bash
npm install -g mcp-scan-dependency
```

### As a Dependency

```bash
npm install mcp-scan-dependency
```

### From Source

```bash
git clone <repository-url>
cd mcp-scan-dependency
npm install
npm run build
```

## Prerequisites

### For JavaScript/TypeScript Projects
- Node.js >= 18.0.0
- npm (comes with Node.js)

### For Python Projects
- Python >= 3.8
- pip
- pip-audit (install with: `pip install pip-audit`)

## Usage

### As an MCP Server

Configure your MCP client (e.g., Claude Desktop) to use this server:

```json
{
  "mcpServers": {
    "dependency-scanner": {
      "command": "npx",
      "args": ["mcp-scan-dependency"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "dependency-scanner": {
      "command": "mcp-scan-dependency"
    }
  }
}
```

### Available Tools

#### 1. `scan_dependencies`

Scans a project for dependency vulnerabilities.

**Parameters:**
- `projectPath` (required): Absolute path to the project directory
- `minSeverity` (optional): Minimum severity level to report (`info`, `low`, `moderate`, `high`, `critical`)
- `suggestAlternatives` (optional): Whether to suggest alternative packages (default: `true`)
- `format` (optional): Output format - `detailed`, `summary`, or `json` (default: `summary`)

**Example Usage:**

```typescript
// Summary format (default, optimized for LLM consumption)
{
  "projectPath": "/path/to/project",
  "format": "summary"
}

// Detailed format (full report)
{
  "projectPath": "/path/to/project",
  "format": "detailed",
  "minSeverity": "high",
  "suggestAlternatives": true
}

// JSON format (for programmatic use)
{
  "projectPath": "/path/to/project",
  "format": "json"
}
```

#### 2. `check_project_type`

Detects project type and validates tool availability.

**Parameters:**
- `projectPath` (required): Absolute path to the project directory

**Example Usage:**

```typescript
{
  "projectPath": "/path/to/project"
}
```

## Output Examples

### Summary Format (LLM-Optimized)

```
⚠️ Found 15 vulnerabilities in this javascript project:
- 2 critical
- 5 high
- 6 moderate
- 2 low
- 0 info

🚨 Priority fixes needed:
- axios@0.21.1 (critical)
  → Upgrade to 0.21.2
  💡 Consider: got, node-fetch
- lodash@4.17.19 (high)
  → Upgrade to 4.17.21
  💡 Consider: lodash-es, ramda
```

### Detailed Format

```
================================================================================
DEPENDENCY VULNERABILITY SCAN REPORT
================================================================================

Project Type: JAVASCRIPT
Project Path: /path/to/project
Scan Date: 4/2/2026, 5:47:09 PM

SUMMARY
--------------------------------------------------------------------------------
Total Vulnerabilities: 15
  Critical: 2
  High: 5
  Moderate: 6
  Low: 2
  Info: 0

VULNERABILITIES
--------------------------------------------------------------------------------

CRITICAL SEVERITY (2)

1. axios@0.21.1
   CVE: CVE-2021-3749
   Description: Axios NPM package 0.21.1 contains a Server-Side Request Forgery (SSRF)
   ✓ Fix: Upgrade to 0.21.2
   💡 Alternative packages: got, node-fetch
   More info: https://github.com/advisories/GHSA-cph5-m8f7-6c5x
```

### JSON Format

Complete structured data including all vulnerability details, CVEs, severity counts, and recommendations.

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Watch Mode

```bash
npm run watch
```

## Project Structure

```
mcp-scan-dependency/
├── src/
│   ├── index.ts              # Main MCP server entry point
│   ├── scanner.ts            # Scanner orchestrator
│   ├── types.ts              # TypeScript type definitions
│   ├── scanners/
│   │   ├── npmScanner.ts     # npm audit integration
│   │   └── pythonScanner.ts  # pip-audit integration
│   └── utils/
│       └── projectDetector.ts # Project type detection
├── dist/                      # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

1. **Project Detection**: Automatically identifies project type by checking for:
   - `package.json` → JavaScript/TypeScript
   - `requirements.txt`, `setup.py`, `pyproject.toml`, `Pipfile` → Python

2. **Tool Validation**: Verifies required scanning tools are installed:
   - JavaScript/TypeScript: `npm`
   - Python: `pip` and `pip-audit`

3. **Vulnerability Scanning**:
   - JavaScript/TypeScript: Uses `npm audit` with JSON output
   - Python: Uses `pip-audit` with JSON output

4. **Intelligence Layer**: Processes raw vulnerability data to:
   - Normalize severity levels across different ecosystems
   - Extract CVE identifiers
   - Map vulnerable packages to safer alternatives
   - Generate actionable recommendations

5. **LLM Integration**: Formats results optimally for LLM consumption, enabling AI assistants to:
   - Warn developers about security issues
   - Suggest specific version upgrades
   - Recommend alternative packages
   - Prioritize fixes by severity

## Alternative Package Suggestions

The server includes a curated database of safer package alternatives:

### JavaScript/TypeScript
- `request` → `axios`, `node-fetch`, `got`
- `moment` → `dayjs`, `date-fns`, `luxon`
- `lodash` → `lodash-es`, `ramda`, `rambda`

### Python
- `requests` → `httpx`, `aiohttp`
- `pyyaml` → `ruamel.yaml`, `strictyaml`
- `flask` → `fastapi`, `starlette`

## Error Handling

The server provides comprehensive error handling:
- Invalid project paths
- Missing package manager files
- Tool availability issues
- Scanning failures
- Parse errors

All errors are returned in a structured format suitable for LLM interpretation.

## Security Best Practices

- **No Credentials Required**: Scans use local tools and registries
- **Read-Only Operations**: Only reads package manifests and lock files
- **No Network Dependency**: Works offline with cached vulnerability databases
- **Isolated Execution**: Scans don't modify project files

## GitHub Actions & CI/CD

This project includes automated workflows for continuous integration and npm publishing:

### Workflows

- **CI** (`ci.yml`): Runs on push/PR, tests across multiple OS and Node versions
- **Publish** (`publish.yml`): Automatically publishes to npm on GitHub releases
- **Release** (`release.yml`): Manages version bumping and release creation

### Publishing to npm

1. **Setup**: Add `NPM_TOKEN` to GitHub repository secrets
2. **Release**: Create a GitHub release or run the Release workflow
3. **Deploy**: Package automatically publishes to npm

See [`.github/DEPLOYMENT.md`](.github/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Publish

```bash
# Automated via GitHub Actions
1. Go to Actions → Release
2. Select version type (patch/minor/major)
3. Run workflow

# Manual
npm version patch  # or minor/major
git push --follow-tags
# Then create GitHub release
```

## Contributing

Contributions are welcome! Please ensure:
1. Code passes TypeScript strict checks
2. ESLint rules are followed
3. New features include appropriate error handling
4. Updates maintain backward compatibility

## License

MIT License - See LICENSE file for details

## Roadmap

- [ ] Support for additional package managers (yarn, pnpm, poetry)
- [ ] Integration with snyk/GitHub Advisory Database
- [ ] Automated fix application (with approval)
- [ ] Vulnerability trend tracking
- [ ] CI/CD integration helpers
- [ ] Support for Go, Rust, and other languages

## Support

For issues, questions, or contributions, please visit the GitHub repository.

---

**Built with ❤️ for the MCP ecosystem**
