/**
 * Project Detection Utilities
 * Detects the type of project and available package managers
 */

import { promises as fs } from 'fs';
import { ProjectType, ProjectDetectionResult } from '../types.js';

/**
 * Detects the type of project based on files present in the directory
 */
export async function detectProjectType(projectPath: string): Promise<ProjectDetectionResult> {
  try {
    const files = await fs.readdir(projectPath);
    const fileSet = new Set(files);

    // Check for JavaScript/TypeScript projects
    if (fileSet.has('package.json')) {
      const hasTypeScript = fileSet.has('tsconfig.json') || 
                           files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
      
      return {
        projectType: hasTypeScript ? ProjectType.TYPESCRIPT : ProjectType.JAVASCRIPT,
        packageManagerFiles: ['package.json'],
        hasLockFile: fileSet.has('package-lock.json') || 
                    fileSet.has('yarn.lock') || 
                    fileSet.has('pnpm-lock.yaml'),
      };
    }

    // Check for Python projects
    if (fileSet.has('requirements.txt') || 
        fileSet.has('setup.py') || 
        fileSet.has('pyproject.toml') ||
        fileSet.has('Pipfile')) {
      
      const packageManagerFiles: string[] = [];
      if (fileSet.has('requirements.txt')) packageManagerFiles.push('requirements.txt');
      if (fileSet.has('setup.py')) packageManagerFiles.push('setup.py');
      if (fileSet.has('pyproject.toml')) packageManagerFiles.push('pyproject.toml');
      if (fileSet.has('Pipfile')) packageManagerFiles.push('Pipfile');

      return {
        projectType: ProjectType.PYTHON,
        packageManagerFiles,
        hasLockFile: fileSet.has('Pipfile.lock') || fileSet.has('poetry.lock'),
      };
    }

    return {
      projectType: ProjectType.UNKNOWN,
      packageManagerFiles: [],
      hasLockFile: false,
    };
  } catch (error) {
    throw new Error(`Failed to detect project type: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validates that required tools are available in the system
 */
export async function validateTools(projectType: ProjectType): Promise<{ available: boolean; missing: string[] }> {
  const missing: string[] = [];

  try {
    if (projectType === ProjectType.JAVASCRIPT || projectType === ProjectType.TYPESCRIPT) {
      // Check for npm
      try {
        const { execSync } = await import('child_process');
        execSync('npm --version', { stdio: 'ignore' });
      } catch {
        missing.push('npm');
      }
    }

    if (projectType === ProjectType.PYTHON) {
      // Check for pip and pip-audit
      try {
        const { execSync } = await import('child_process');
        execSync('pip --version', { stdio: 'ignore' });
      } catch {
        missing.push('pip');
      }

      try {
        const { execSync } = await import('child_process');
        execSync('pip-audit --version', { stdio: 'ignore' });
      } catch {
        missing.push('pip-audit (install with: pip install pip-audit)');
      }
    }

    return {
      available: missing.length === 0,
      missing,
    };
  } catch (error) {
    throw new Error(`Failed to validate tools: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Checks if a path exists and is a directory
 */
export async function isValidProjectPath(path: string): Promise<boolean> {
  try {
    const stats = await fs.stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
