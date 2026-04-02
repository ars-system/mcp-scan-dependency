# MCP Dependency Scanner

Hey there! 👋 This is a Model Context Protocol (MCP) server that helps you keep your JavaScript/TypeScript and Python projects secure by scanning for dependency vulnerabilities. Think of it as a security guard for your dependencies - it finds vulnerable packages and suggests better alternatives.

Built to work seamlessly with AI assistants like Claude, this tool makes security recommendations intelligent and actionable.

## What Can It Do?

- 🔍 **Multi-Language Support** - Works with JavaScript/TypeScript (via `npm audit`) and Python (via `pip-audit`) projects
- 🎯 **Smart Detection** - Automatically figures out what kind of project you're working on
- 🚨 **Severity Levels** - Tells you what's critical and what can wait (Critical → High → Moderate → Low → Info)
- 💡 **Better Alternatives** - Suggests safer packages you can use instead of vulnerable ones
- 📊 **Flexible Reports** - Get detailed reports, quick summaries, or raw JSON - your choice
- 🔒 **Battle-Tested** - Built with TypeScript strict mode and comprehensive error handling

## Getting Started

### Quick Install

Install it globally and you're ready to go:

```bash
npm install -g mcp-scan-dependency
```

Or add it to your project:

```bash
npm install mcp-scan-dependency
```

### Building from Source

Prefer to build it yourself? No problem:

```bash
git clone https://github.com/ars-system/mcp-scan-dependency.git
cd mcp-scan-dependency
npm install
npm run build
```

## What You'll Need

### For JavaScript/TypeScript Projects

- Node.js 18.0.0 or newer (npm comes bundled with it)

### For Python Projects

- Python 3.8 or newer
- pip (usually comes with Python)
- pip-audit - Install it with: `pip install pip-audit`

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

## Deployment

We keep things simple here. Every time you push to the `main` branch, the package automatically gets published to npm. That's it!

### How It Works

The GitHub Action workflow (`.github/workflows/publish.yml`) automatically:

1. Runs linting checks to make sure code quality is good
2. Builds the TypeScript project
3. Publishes to npm using the `NPM_TOKEN` secret

### Setting Up Deployment

If you're forking this project, just add your `NPM_TOKEN` to the GitHub repository secrets, and you're all set. Push to main, and watch the magic happen!

**Pro tip:** Remember to bump the version in `package.json` before pushing, otherwise npm will reject the publish if that version already exists.

### Manual Publishing

Prefer to publish manually? You can still do it the old-fashioned way:

```bash
npm version patch  # or minor/major
npm run build
npm publish
```

## Want to Contribute?

We'd love your help! Before submitting a PR, just make sure:

1. Your code passes TypeScript's strict checks (we like type safety)
2. ESLint is happy (pre-commit hooks will check this for you)
3. You've added proper error handling for new features
4. Your changes don't break existing functionality

The pre-commit hooks will automatically lint and format your code when you commit, so you don't have to worry about forgetting!

## License

MIT License - See LICENSE file for details

## Roadmap

- [ ] Support for additional package managers (yarn, pnpm, poetry)
- [ ] Integration with snyk/GitHub Advisory Database
- [ ] Automated fix application (with approval)
- [ ] Vulnerability trend tracking
- [ ] CI/CD integration helpers
- [ ] Support for Go, Rust, and other languages

## Need Help?

Run into issues or have questions? Head over to the [GitHub repository](https://github.com/ars-system/mcp-scan-dependency) and open an issue. We're here to help!

---

**Built with ❤️ for the MCP ecosystem**

Made by developers who care about security and want to make it easier for everyone.
