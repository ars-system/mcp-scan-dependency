# Deployment Guide

This guide explains how to publish `mcp-scan-dependency` to npm using GitHub Actions.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **npm Access Token**: Generate a token at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/~/tokens)
   - Select "Automation" type token
   - Grant "Read and Write" permissions
3. **GitHub Repository**: Push your code to GitHub

## Setup

### 1. Add npm Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm access token
6. Click **Add secret**

### 2. Update package.json

Before publishing, update these fields in `package.json`:

```json
{
  "name": "mcp-scan-dependency",
  "version": "1.0.0",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/ars-system/mcp-scan-dependency.git"
  },
  "bugs": {
    "url": "https://github.com/ars-system/mcp-scan-dependency/issues"
  },
  "homepage": "https://github.com/ars-system/mcp-scan-dependency#readme"
}
```

## Publishing Methods

### Method 1: Automated Release (Recommended)

1. **Trigger Release Workflow**:
   - Go to **Actions** → **Release** workflow
   - Click **Run workflow**
   - Select version bump type (patch/minor/major)
   - Click **Run workflow**

2. **What Happens**:
   - Version is bumped automatically
   - CHANGELOG is updated
   - Git tag is created
   - GitHub release is created
   - This triggers the publish workflow
   - Package is published to npm

### Method 2: Manual Release

1. **Create a GitHub Release**:
   - Go to **Releases** → **Create a new release**
   - Create a new tag (e.g., `v1.0.0`)
   - Fill in release notes
   - Click **Publish release**

2. **Automatic Publishing**:
   - The publish workflow automatically triggers
   - Package is built and published to npm

### Method 3: Manual Workflow Dispatch

1. Go to **Actions** → **Publish to npm**
2. Click **Run workflow**
3. Optionally specify a version
4. Click **Run workflow**

## CI/CD Workflows

### CI Workflow

**Trigger**: Push or PR to `main` or `develop` branches

**What it does**:
- Runs on Ubuntu, macOS, and Windows
- Tests with Node.js 18.x, 20.x, and 22.x
- Lints code with ESLint
- Builds TypeScript
- Validates type checking

### Publish Workflow

**Trigger**: GitHub release created or manual dispatch

**What it does**:
- Installs dependencies
- Runs linting
- Builds project
- Publishes to npm with provenance
- Creates release notes

### Release Workflow

**Trigger**: Manual dispatch only

**What it does**:
- Bumps version (patch/minor/major)
- Updates CHANGELOG
- Creates Git tag
- Pushes changes
- Creates GitHub release

## Version Management

### Semantic Versioning

- **Patch** (1.0.x): Bug fixes, minor changes
- **Minor** (1.x.0): New features, backward compatible
- **Major** (x.0.0): Breaking changes

### Manual Version Bump

```bash
# Patch release (1.0.0 → 1.0.1)
npm version patch

# Minor release (1.0.0 → 1.1.0)
npm version minor

# Major release (1.0.0 → 2.0.0)
npm version major

# Push tags
git push --follow-tags
```

## Pre-publish Checklist

Before publishing, ensure:

- [ ] All tests pass locally: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Version number is correct in `package.json`
- [ ] CHANGELOG.md is updated
- [ ] README.md is up to date
- [ ] LICENSE is included
- [ ] Author and repository info in package.json
- [ ] npm token is set in GitHub secrets

## Post-publish Steps

After publishing:

1. Verify package on npm: `https://www.npmjs.com/package/mcp-scan-dependency`
2. Test installation: `npm install -g mcp-scan-dependency`
3. Test functionality: `mcp-scan-dependency --help`
4. Announce release in relevant channels

## Troubleshooting

### Publishing Fails

**Error: Need to provide authToken**
- Solution: Ensure `NPM_TOKEN` is set in GitHub secrets

**Error: You cannot publish over the previously published versions**
- Solution: Bump version in package.json

**Error: 403 Forbidden**
- Solution: Check npm token permissions and package name availability

### CI Fails

**Linting errors**
- Solution: Run `npm run lint:fix` locally and commit

**Build errors**
- Solution: Fix TypeScript errors and test with `npm run build`

## Security

- Never commit npm tokens to the repository
- Use GitHub Secrets for sensitive data
- Enable npm provenance for transparency
- Regularly rotate npm access tokens

## Support

For issues with deployment, check:
- GitHub Actions logs
- npm package page
- Repository issues
