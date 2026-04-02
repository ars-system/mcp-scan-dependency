/**
 * NPM Audit Scanner
 * Scans JavaScript/TypeScript projects using npm audit
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { ScanResult, Vulnerability, SeverityLevel, ProjectType, ScanOptions } from '../types.js';

const execAsync = promisify(exec);

interface NpmAuditVulnerability {
  name: string;
  severity: string;
  via: Array<string | { title: string; url: string }>;
  range: string;
  nodes: string[];
  fixAvailable: boolean | { name: string; version: string; isSemVerMajor: boolean };
}

interface NpmAuditOutput {
  auditReportVersion: number;
  vulnerabilities: Record<string, NpmAuditVulnerability>;
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    };
  };
}

/**
 * Maps npm severity to our SeverityLevel enum
 */
function mapSeverity(npmSeverity: string): SeverityLevel {
  const severityMap: Record<string, SeverityLevel> = {
    critical: SeverityLevel.CRITICAL,
    high: SeverityLevel.HIGH,
    moderate: SeverityLevel.MODERATE,
    low: SeverityLevel.LOW,
    info: SeverityLevel.INFO,
  };
  return severityMap[npmSeverity.toLowerCase()] || SeverityLevel.INFO;
}

/**
 * Extracts CVE information from vulnerability data
 */
function extractCVE(via: Array<string | { title: string; url: string }>): { cve?: string; url?: string; description?: string } {
  for (const item of via) {
    if (typeof item === 'object' && item.title) {
      const cveMatch = item.title.match(/CVE-\d{4}-\d+/);
      return {
        cve: cveMatch ? cveMatch[0] : undefined,
        url: item.url,
        description: item.title,
      };
    }
  }
  return {};
}

/**
 * Suggests alternative packages for vulnerable dependencies
 */
async function suggestAlternatives(packageName: string): Promise<string[]> {
  // This is a placeholder for more sophisticated alternative suggestion logic
  // In a production system, you might want to:
  // 1. Query a database of package alternatives
  // 2. Use npm search API
  // 3. Check snyk or other security advisories
  
  const alternativesMap: Record<string, string[]> = {
    'request': ['axios', 'node-fetch', 'got'],
    'moment': ['dayjs', 'date-fns', 'luxon'],
    'lodash': ['lodash-es', 'ramda', 'rambda'],
    'validator': ['joi', 'yup', 'zod'],
  };

  return alternativesMap[packageName] || [];
}

/**
 * Scans a JavaScript/TypeScript project using npm audit
 */
export async function scanNpmProject(
  projectPath: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const vulnerabilities: Vulnerability[] = [];

  try {
    // Run npm audit with JSON output
    const { stdout } = await execAsync('npm audit --json', {
      cwd: projectPath,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const auditData: NpmAuditOutput = JSON.parse(stdout);

    // Process vulnerabilities
    for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
      const severity = mapSeverity(vulnData.severity);

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

      const { cve, url, description } = extractCVE(vulnData.via);
      const viaPackages = vulnData.via
        .filter((v): v is string => typeof v === 'string')
        .filter(v => v !== packageName);

      // Determine recommended version
      let recommendedVersion: string | undefined;
      if (typeof vulnData.fixAvailable === 'object' && vulnData.fixAvailable.version) {
        recommendedVersion = vulnData.fixAvailable.version;
      }

      // Get alternative packages if requested
      let alternativePackages: string[] | undefined;
      if (options.suggestAlternatives) {
        alternativePackages = await suggestAlternatives(packageName);
      }

      vulnerabilities.push({
        packageName,
        installedVersion: vulnData.range,
        severity,
        cve,
        description: description || `Vulnerability found in ${packageName}`,
        recommendedVersion,
        alternativePackages: alternativePackages && alternativePackages.length > 0 ? alternativePackages : undefined,
        moreInfoUrl: url,
        via: viaPackages.length > 0 ? viaPackages : undefined,
      });
    }

    return {
      projectType: ProjectType.JAVASCRIPT,
      projectPath,
      totalVulnerabilities: auditData.metadata.vulnerabilities.total,
      severityCounts: {
        critical: auditData.metadata.vulnerabilities.critical,
        high: auditData.metadata.vulnerabilities.high,
        moderate: auditData.metadata.vulnerabilities.moderate,
        low: auditData.metadata.vulnerabilities.low,
        info: auditData.metadata.vulnerabilities.info,
      },
      vulnerabilities,
      scannedAt: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      // Try to parse the output anyway
      if ('stdout' in error && typeof error.stdout === 'string') {
        try {
          const auditData: NpmAuditOutput = JSON.parse(error.stdout);
          // Process the same way as above
          for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
            const severity = mapSeverity(vulnData.severity);
            const { cve, url, description } = extractCVE(vulnData.via);
            const viaPackages = vulnData.via
              .filter((v): v is string => typeof v === 'string')
              .filter(v => v !== packageName);

            let recommendedVersion: string | undefined;
            if (typeof vulnData.fixAvailable === 'object' && vulnData.fixAvailable.version) {
              recommendedVersion = vulnData.fixAvailable.version;
            }

            let alternativePackages: string[] | undefined;
            if (options.suggestAlternatives) {
              alternativePackages = await suggestAlternatives(packageName);
            }

            vulnerabilities.push({
              packageName,
              installedVersion: vulnData.range,
              severity,
              cve,
              description: description || `Vulnerability found in ${packageName}`,
              recommendedVersion,
              alternativePackages: alternativePackages && alternativePackages.length > 0 ? alternativePackages : undefined,
              moreInfoUrl: url,
              via: viaPackages.length > 0 ? viaPackages : undefined,
            });
          }

          return {
            projectType: ProjectType.JAVASCRIPT,
            projectPath,
            totalVulnerabilities: auditData.metadata.vulnerabilities.total,
            severityCounts: {
              critical: auditData.metadata.vulnerabilities.critical,
              high: auditData.metadata.vulnerabilities.high,
              moderate: auditData.metadata.vulnerabilities.moderate,
              low: auditData.metadata.vulnerabilities.low,
              info: auditData.metadata.vulnerabilities.info,
            },
            vulnerabilities,
            scannedAt: new Date().toISOString(),
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined,
          };
        } catch {
          // If parsing fails, throw the original error
          errors.push(`Failed to parse npm audit output: ${error.message}`);
        }
      } else {
        errors.push(`npm audit failed: ${error.message}`);
      }
    }

    // Return empty result with errors
    return {
      projectType: ProjectType.JAVASCRIPT,
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
