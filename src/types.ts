/**
 * Types for MCP Dependency Scanner
 */

export enum ProjectType {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  UNKNOWN = 'unknown',
}

export enum SeverityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MODERATE = 'moderate',
  LOW = 'low',
  INFO = 'info',
}

export interface Vulnerability {
  /** Package name with the vulnerability */
  packageName: string;
  /** Current installed version */
  installedVersion: string;
  /** Severity level of the vulnerability */
  severity: SeverityLevel;
  /** CVE identifier if available */
  cve?: string;
  /** Description of the vulnerability */
  description: string;
  /** Recommended version to upgrade to */
  recommendedVersion?: string;
  /** Alternative packages that could be used instead */
  alternativePackages?: string[];
  /** Link to more information */
  moreInfoUrl?: string;
  /** Path to the vulnerable dependency (direct or transitive) */
  via?: string[];
}

export interface ScanResult {
  /** Type of project scanned */
  projectType: ProjectType;
  /** Path to the project */
  projectPath: string;
  /** Total number of vulnerabilities found */
  totalVulnerabilities: number;
  /** Breakdown by severity */
  severityCounts: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    info: number;
  };
  /** List of vulnerabilities found */
  vulnerabilities: Vulnerability[];
  /** Timestamp of the scan */
  scannedAt: string;
  /** Any errors encountered during scanning */
  errors?: string[];
  /** Warnings or additional information */
  warnings?: string[];
}

export interface ProjectDetectionResult {
  projectType: ProjectType;
  packageManagerFiles: string[];
  hasLockFile: boolean;
}

export interface ScanOptions {
  /** Whether to include transitive dependencies */
  includeTransitive?: boolean;
  /** Minimum severity level to report */
  minSeverity?: SeverityLevel;
  /** Whether to suggest alternative packages */
  suggestAlternatives?: boolean;
  /** Custom registry URL (for npm/pip) */
  registryUrl?: string;
}

export interface AlternativePackage {
  name: string;
  description: string;
  downloads?: number;
  lastUpdate?: string;
  securityScore?: number;
}
