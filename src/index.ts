#!/usr/bin/env node

/**
 * MCP Dependency Scanner Server
 * Main entry point for the MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { scanProject, formatScanResults, generateLLMSummary } from './scanner.js';
import { ScanOptions, SeverityLevel } from './types.js';

// Server configuration
const SERVER_NAME = 'mcp-scan-dependency';
const SERVER_VERSION = '1.0.0';

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'scan_dependencies',
    description: 'Scans a JavaScript/TypeScript or Python project for dependency vulnerabilities using npm audit or pip-audit. Returns detailed vulnerability information including CVEs, severity levels, recommended fixes, and alternative package suggestions.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Absolute path to the project directory to scan',
        },
        minSeverity: {
          type: 'string',
          enum: ['info', 'low', 'moderate', 'high', 'critical'],
          description: 'Minimum severity level to report (default: info)',
        },
        suggestAlternatives: {
          type: 'boolean',
          description: 'Whether to suggest alternative packages for vulnerable dependencies (default: true)',
        },
        format: {
          type: 'string',
          enum: ['detailed', 'summary', 'json'],
          description: 'Output format: detailed report, brief summary, or raw JSON (default: summary)',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'check_project_type',
    description: 'Detects the type of project (JavaScript/TypeScript/Python) and checks if required scanning tools are available.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Absolute path to the project directory',
        },
      },
      required: ['projectPath'],
    },
  },
];

/**
 * Main server instance
 */
class DependencyScannerServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'scan_dependencies':
            return await this.handleScanDependencies(args || {});

          case 'check_project_type':
            return await this.handleCheckProjectType(args || {});

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleScanDependencies(args: Record<string, unknown>): Promise<{
    content: Array<{ type: string; text: string }>;
  }> {
    const projectPath = args.projectPath as string;
    const minSeverity = (args.minSeverity as SeverityLevel) || undefined;
    const suggestAlternatives = args.suggestAlternatives !== false; // default true
    const format = (args.format as string) || 'summary';

    if (!projectPath) {
      throw new Error('projectPath is required');
    }

    // Build scan options
    const options: ScanOptions = {
      minSeverity,
      suggestAlternatives,
    };

    // Perform the scan
    const result = await scanProject(projectPath, options);

    // Format output based on requested format
    let output: string;
    switch (format) {
      case 'detailed':
        output = formatScanResults(result);
        break;
      case 'summary':
        output = generateLLMSummary(result);
        break;
      case 'json':
        output = JSON.stringify(result, null, 2);
        break;
      default:
        output = generateLLMSummary(result);
    }

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  }

  private async handleCheckProjectType(args: Record<string, unknown>): Promise<{
    content: Array<{ type: string; text: string }>;
  }> {
    const projectPath = args.projectPath as string;

    if (!projectPath) {
      throw new Error('projectPath is required');
    }

    const { detectProjectType, validateTools } = await import('./utils/projectDetector.js');
    
    const detection = await detectProjectType(projectPath);
    const toolValidation = await validateTools(detection.projectType);

    const output = [
      `Project Type: ${detection.projectType.toUpperCase()}`,
      `Package Manager Files: ${detection.packageManagerFiles.join(', ') || 'None'}`,
      `Has Lock File: ${detection.hasLockFile ? 'Yes' : 'No'}`,
      '',
      'Tool Availability:',
      toolValidation.available 
        ? '✅ All required tools are available'
        : `❌ Missing tools: ${toolValidation.missing.join(', ')}`,
    ].join('\n');

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log to stderr (stdout is used for MCP communication)
    console.error(`${SERVER_NAME} v${SERVER_VERSION} started`);
  }
}

// Start the server
const server = new DependencyScannerServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
