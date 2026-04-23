# MCP Dependency Scanner

A lightweight **MCP server** to scan dependencies for vulnerabilities in JavaScript/TypeScript and Python projects.
Built for LLM agents — not a general CLI tool.

---

## Install (Recommended)

```bash
npm install -g mcp-scan-dependency
```

---

## MCP Setup

```json
{
  "mcpServers": {
    "dependency-scanner": {
      "command": "mcp-scan-dependency"
    }
  }
}
```

---

## Available Tools

### `scan_dependencies`

* `projectPath`
* `minSeverity`
* `suggestAlternatives`
* `format` → `summary | detailed | json`

---

### `check_project_type`

* `projectPath`

---

## Test Prompt

Use this to verify MCP is working:

```
Scan dependencies in /your/project/path and show only high and critical vulnerabilities.
```

---

## Notes

* Built on official `npm audit` and `pip-audit`
* Read-only scan (no file changes)
* Designed for MCP / LLM usage
