/**
 * Python Vulnerability Scanner
 * Scans Python projects using pip-audit
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { ScanResult, Vulnerability, SeverityLevel, ProjectType, ScanOptions } from '../types.js';

const execAsync = promisify(exec);

interface PipAuditVulnerability {
  name: string;
  version: string;
  vulns: Array<{
    id: string;
    fix_versions: string[];
    aliases: string[];
    description: string;
  }>;
}

interface PipAuditOutput {
  dependencies: PipAuditVulnerability[];
}

/**
 * Maps vulnerability ID to severity level
 * pip-audit doesn't always provide severity, so we use heuristics
 */
function estimateSeverity(description: string, fixVersions: string[]): SeverityLevel {
  const lowerDesc = description.toLowerCase();
  
  // Critical keywords
  if (lowerDesc.includes('remote code execution') || 
      lowerDesc.includes('arbitrary code') ||
      lowerDesc.includes('privilege escalation')) {
    return SeverityLevel.CRITICAL;
  }
  
  // High severity keywords
  if (lowerDesc.includes('sql injection') ||
      lowerDesc.includes('xss') ||
      lowerDesc.includes('authentication bypass') ||
      lowerDesc.includes('denial of service')) {
    return SeverityLevel.HIGH;
  }
  
  // Moderate severity
  if (lowerDesc.includes('information disclosure') ||
      lowerDesc.includes('bypass') ||
      fixVersions.length > 0) {
    return SeverityLevel.MODERATE;
  }
  
  // Default to low
  return SeverityLevel.LOW;
}

/**
 * Suggests alternative Python packages
 */
async function suggestPythonAlternatives(packageName: string): Promise<string[]> {
  // Common Python package alternatives
  const alternativesMap: Record<string, string[]> = {
    'requests': ['httpx', 'aiohttp'],
    'urllib3': ['httpx', 'requests'],
    'pyyaml': ['ruamel.yaml', 'strictyaml'],
    'pillow': ['imageio', 'scikit-image'],
    'django': ['flask', 'fastapi'],
    'flask': ['fastapi', 'django', 'starlette'],
    'sqlalchemy': ['tortoise-orm', 'peewee'],
    'cryptography': ['pycryptodome', 'nacl'],
  };

  return alternativesMap[packageName.toLowerCase()] || [];
}

/**
 * Scans a Python project using pip-audit
 */
export async function scanPythonProject(
  projectPath: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const vulnerabilities: Vulnerability[] = [];

  try {
    // Run pip-audit with JSON output
    // We scan requirements.txt if it exists, otherwise scan the environment
    let command = 'pip-audit --format json';
    
    // Check if requirements.txt exists
    const { promises: fs } = await import('fs');
    const { join } = await import('path');
    
    try {
      await fs.access(join(projectPath, 'requirements.txt'));
      command += ' -r requirements.txt';
    } catch {
      // If no requirements.txt, try to scan the environment
      warnings.push('No requirements.txt found, scanning installed packages in current environment');
    }

    const { stdout } = await execAsync(command, {
      cwd: projectPath,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const auditData: PipAuditOutput = JSON.parse(stdout);

    // Count vulnerabilities by severity
    const severityCounts = {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      info: 0,
    };

    // Process vulnerabilities
    for (const dep of auditData.dependencies) {
      for (const vuln of dep.vulns) {
        const severity = estimateSeverity(vuln.description, vuln.fix_versions);

        // Filter by minimum severity if specified
        if (options.minSeverity) {
          const severityOrder = [
            SeverityLevel.INFO,
            SeverityLevel.LOW,
            SeverityLevel.MODERATE,
            SeverityLevel.HIGH,
            SeverityLevel.CRITICAL,
          ];
          const currentIndex = severityOrder.indexOf(severity);
          const minIndex = severityOrder.indexOf(options.minSeverity);
          if (currentIndex < minIndex) {
            continue;
          }
        }

        // Update severity counts
        severityCounts[severity]++;

        // Get alternative packages if requested
        let alternativePackages: string[] | undefined;
        if (options.suggestAlternatives) {
          alternativePackages = await suggestPythonAlternatives(dep.name);
        }

        // Extract CVE from aliases
        const cve = vuln.aliases.find(alias => alias.startsWith('CVE-'));

        vulnerabilities.push({
          packageName: dep.name,
          installedVersion: dep.version,
          severity,
          cve,
          description: vuln.description,
          recommendedVersion: vuln.fix_versions.length > 0 ? vuln.fix_versions[0] : undefined,
          alternativePackages: alternativePackages && alternativePackages.length > 0 ? alternativePackages : undefined,
          moreInfoUrl: `https://pypi.org/project/${dep.name}/`,
        });
      }
    }

    return {
      projectType: ProjectType.PYTHON,
      projectPath,
      totalVulnerabilities: vulnerabilities.length,
      severityCounts,
      vulnerabilities,
      scannedAt: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      // pip-audit returns non-zero exit code when vulnerabilities are found
      // Try to parse the output anyway
      if ('stdout' in error && typeof error.stdout === 'string' && error.stdout.trim()) {
        try {
          const auditData: PipAuditOutput = JSON.parse(error.stdout);
          
          const severityCounts = {
            critical: 0,
            high: 0,
            moderate: 0,
            low: 0,
            info: 0,
          };

          for (const dep of auditData.dependencies) {
            for (const vuln of dep.vulns) {
              const severity = estimateSeverity(vuln.description, vuln.fix_versions);
              severityCounts[severity]++;

              let alternativePackages: string[] | undefined;
              if (options.suggestAlternatives) {
                alternativePackages = await suggestPythonAlternatives(dep.name);
              }

              const cve = vuln.aliases.find(alias => alias.startsWith('CVE-'));

              vulnerabilities.push({
                packageName: dep.name,
                installedVersion: dep.version,
                severity,
                cve,
                description: vuln.description,
                recommendedVersion: vuln.fix_versions.length > 0 ? vuln.fix_versions[0] : undefined,
                alternativePackages: alternativePackages && alternativePackages.length > 0 ? alternativePackages : undefined,
                moreInfoUrl: `https://pypi.org/project/${dep.name}/`,
              });
            }
          }

          return {
            projectType: ProjectType.PYTHON,
            projectPath,
            totalVulnerabilities: vulnerabilities.length,
            severityCounts,
            vulnerabilities,
            scannedAt: new Date().toISOString(),
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined,
          };
        } catch {
          errors.push(`Failed to parse pip-audit output: ${error.message}`);
        }
      } else {
        errors.push(`pip-audit failed: ${error.message}. Make sure pip-audit is installed (pip install pip-audit)`);
      }
    }

    // Return empty result with errors
    return {
      projectType: ProjectType.PYTHON,
      projectPath,
      totalVulnerabilities: 0,
      severityCounts: {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        info: 0,
      },
      vulnerabilities: [],
      scannedAt: new Date().toISOString(),
      errors,
    };
  }
}
