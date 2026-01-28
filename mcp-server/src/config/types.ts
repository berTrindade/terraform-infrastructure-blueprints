/**
 * TypeScript type definitions for the MCP server
 */

/**
 * Cloud provider type
 */
export type CloudProvider = "aws" | "azure" | "gcp";

/**
 * Blueprint pattern type
 */
export type Pattern = "Sync" | "Async" | "N/A";

/**
 * Blueprint metadata
 */
export interface Blueprint {
    name: string;
    description: string;
    database: string;
    pattern: Pattern;
    useCase: string;
    origin: string;
}

/**
 * Project to blueprint mapping
 */
export interface ProjectBlueprint {
    blueprint: string;
    cloud: CloudProvider;
    description: string;
}

/**
 * Extraction pattern configuration
 */
export interface ExtractionPattern {
    blueprint: string;
    modules: string[];
    description: string;
    integrationSteps: string[];
}

/**
 * File reading result
 */
export interface FileContent {
    content: string;
    mimeType: string;
}

/**
 * Resource metadata
 */
export interface ResourceMetadata {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}
