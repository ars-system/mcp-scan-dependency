/**
 * Main Scanner Orchestrator
 * Coordinates project detection and vulnerability scanning
 */

import { detectProjectType, validateTools, isValidProjectPath } from './utils/projectDetector.js';
import { scanNpmProject } from './scanners/npmScanner.js';
import { scanPythonProject } from './scanners/pythonScanner.js';
import { ScanResult, ProjectType, ScanOptions } from './types.js';

/**
 * Main function to scan a project for vulnerabilities
 */
export async function scanProject(
  projectPath: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  // Validate project path
  if (!await isValidProjectPath(projectPath)) {
    throw new Error(`Invalid project path: ${projectPath}`);
  }

  // Detect project type
  const detection = await detectProjectType(projectPath);

  if (detection.projectType === ProjectType.UNKNOWN) {
    throw new Error(
      'Unable to detect project type. Please ensure the directory contains ' +
      'package.json (JS/TS) or requirements.txt/setup.py/pyproject.toml (Python)'
    );
  }

  // Validate required tools
  const toolValidation = await validateTools(detection.projectType);
  if (!toolValidation.available) {
    throw new Error(
      `Missing required tools: ${toolValidation.missing.join(', ')}`
    );
  }

  // Perform the scan based on project type
  switch (detection.projectType) {
    case ProjectType.JAVASCRIPT:
    case ProjectType.TYPESCRIPT:
      return await scanNpmProject(projectPath, options);

    case ProjectType.PYTHON:
      return await scanPythonProject(projectPath, options);

    default:
      throw new Error(`Unsupported project type: ${detection.projectType}`);
  }
}

/**
 * Formats scan results into a human-readable report
 */
export function formatScanResults(result: ScanResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('DEPENDENCY VULNERABILITY SCAN REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Project Type: ${result.projectType.toUpperCase()}`);
  lines.push(`Project Path: ${result.projectPath}`);
  lines.push(`Scan Date: ${new Date(result.scannedAt).toLocaleString()}`);
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push('-'.repeat(80));
  lines.push(`Total Vulnerabilities: ${result.totalVulnerabilities}`);
  lines.push(`  Critical: ${result.severityCounts.critical}`);
  lines.push(`  High: ${result.severityCounts.high}`);
  lines.push(`  Moderate: ${result.severityCounts.moderate}`);
  lines.push(`  Low: ${result.severityCounts.low}`);
  lines.push(`  Info: ${result.severityCounts.info}`);
  lines.push('');

  // Errors and warnings
  if (result.errors && result.errors.length > 0) {
    lines.push('ERRORS');
    lines.push('-'.repeat(80));
    result.errors.forEach(error => lines.push(`  ⚠️  ${error}`));
    lines.push('');
  }

  if (result.warnings && result.warnings.length > 0) {
    lines.push('WARNINGS');
    lines.push('-'.repeat(80));
    result.warnings.forEach(warning => lines.push(`  ⚠️  ${warning}`));
    lines.push('');
  }

  // Detailed vulnerabilities
  if (result.vulnerabilities.length > 0) {
    lines.push('VULNERABILITIES');
    lines.push('-'.repeat(80));
    lines.push('');

    // Group by severity
    const severityOrder = ['critical', 'high', 'moderate', 'low', 'info'];
    for (const severity of severityOrder) {
      const vulns = result.vulnerabilities.filter(v => v.severity === severity);
      if (vulns.length === 0) continue;

      lines.push(`${severity.toUpperCase()} SEVERITY (${vulns.length})`);
      lines.push('');

      vulns.forEach((vuln, index) => {
        lines.push(`${index + 1}. ${vuln.packageName}@${vuln.installedVersion}`);
        if (vuln.cve) {
          lines.push(`   CVE: ${vuln.cve}`);
        }
        lines.push(`   Description: ${vuln.description}`);
        
        if (vuln.via && vuln.via.length > 0) {
          lines.push(`   Via: ${vuln.via.join(' > ')}`);
        }
        
        if (vuln.recommendedVersion) {
          lines.push(`   ✓ Fix: Upgrade to ${vuln.recommendedVersion}`);
        }
        
        if (vuln.alternativePackages && vuln.alternativePackages.length > 0) {
          lines.push(`   💡 Alternative packages: ${vuln.alternativePackages.join(', ')}`);
        }
        
        if (vuln.moreInfoUrl) {
          lines.push(`   More info: ${vuln.moreInfoUrl}`);
        }
        
        lines.push('');
      });
    }
  } else {
    lines.push('✅ No vulnerabilities found!');
    lines.push('');
  }

  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Generates a brief summary for LLM consumption
 */
export function generateLLMSummary(result: ScanResult): string {
  if (result.totalVulnerabilities === 0) {
    return `✅ Good news! No vulnerabilities detected in this ${result.projectType} project.`;
  }

  const lines: string[] = [];
  lines.push(`⚠️ Found ${result.totalVulnerabilities} vulnerabilities in this ${result.projectType} project:`);
  lines.push(`- ${result.severityCounts.critical} critical`);
  lines.push(`- ${result.severityCounts.high} high`);
  lines.push(`- ${result.severityCounts.moderate} moderate`);
  lines.push(`- ${result.severityCounts.low} low`);
  lines.push(`- ${result.severityCounts.info} info`);
  lines.push('');

  // Highlight critical and high severity issues
  const criticalAndHigh = result.vulnerabilities.filter(
    v => v.severity === 'critical' || v.severity === 'high'
  );

  if (criticalAndHigh.length > 0) {
    lines.push('🚨 Priority fixes needed:');
    criticalAndHigh.slice(0, 5).forEach(vuln => {
      lines.push(`- ${vuln.packageName}@${vuln.installedVersion} (${vuln.severity})`);
      if (vuln.recommendedVersion) {
        lines.push(`  → Upgrade to ${vuln.recommendedVersion}`);
      }
      if (vuln.alternativePackages && vuln.alternativePackages.length > 0) {
        lines.push(`  💡 Consider: ${vuln.alternativePackages.join(', ')}`);
      }
    });
  }

  return lines.join('\n');
}
