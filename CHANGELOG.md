# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-02

### Added
- Initial release of MCP Dependency Scanner
- Support for JavaScript/TypeScript project scanning via npm audit
- Support for Python project scanning via pip-audit
- Automatic project type detection
- Two MCP tools: `scan_dependencies` and `check_project_type`
- Vulnerability severity classification (Critical, High, Moderate, Low, Info)
- Alternative package suggestions for vulnerable dependencies
- Multiple output formats: detailed, summary, and JSON
- Comprehensive error handling and validation
- Tool availability checking
- Production-ready TypeScript codebase with strict mode
- ESLint configuration for code quality
- Detailed documentation and examples

### Features
- Scans both direct and transitive dependencies
- Extracts CVE identifiers from vulnerability data
- Provides recommended version upgrades
- Suggests alternative packages as replacements
- Generates LLM-optimized summaries for AI assistants
- Supports severity filtering
- Cross-platform compatibility (Windows, macOS, Linux)

### Security
- Read-only operations
- No credentials required
- No network dependencies for core functionality
- Isolated execution environment
