#!/usr/bin/env node
export declare const BLUEPRINTS: {
    name: string;
    description: string;
    database: string;
    pattern: string;
    useCase: string;
    origin: string;
}[];
export declare const CROSS_CLOUD_EQUIVALENTS: Record<string, {
    aws?: string;
    azure?: string;
    gcp?: string;
    description: string;
}>;
export declare const PROJECT_BLUEPRINTS: Record<string, {
    blueprint: string;
    cloud: "aws" | "azure" | "gcp";
    description: string;
}>;
export declare const EXTRACTION_PATTERNS: Record<string, {
    blueprint: string;
    modules: string[];
    description: string;
    integrationSteps: string[];
}>;
export declare const COMPARISONS: Record<string, {
    optionA: {
        name: string;
        blueprints: string[];
    };
    optionB: {
        name: string;
        blueprints: string[];
    };
    factors: Array<{
        factor: string;
        optionA?: string;
        optionB?: string;
        description?: string;
    }>;
}>;
//# sourceMappingURL=index.d.ts.map