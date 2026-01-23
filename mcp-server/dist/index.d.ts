#!/usr/bin/env node
export declare const BLUEPRINTS: {
    name: string;
    description: string;
    database: string;
    pattern: string;
    useCase: string;
}[];
export declare const EXTRACTION_PATTERNS: Record<string, {
    blueprint: string;
    modules: string[];
    description: string;
    integrationSteps: string[];
}>;
export declare const COMPARISONS: Record<string, {
    optionA: any;
    optionB: any;
    factors: Array<{
        factor: string;
        optionA: string;
        optionB: string;
    }>;
}>;
//# sourceMappingURL=index.d.ts.map