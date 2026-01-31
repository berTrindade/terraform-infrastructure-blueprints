import { describe, test, expect } from '@jest/globals';
import { loadManifest, findSnippet, validateParams } from '../scripts/parse-manifest.js';
import { renderTemplate } from '../scripts/render-template.js';

describe('generate (integration)', () => {
  test('should generate code with valid payload', () => {
    const payload = {
      blueprint: 'apigw-lambda-rds',
      snippet: 'rds-module',
      params: {
        db_identifier: 'test-db',
        db_name: 'testdb',
        db_subnet_group_name: 'test-subnets',
        security_group_id: 'sg-12345678',
        engine_version: '15.4',
        instance_class: 'db.t3.micro',
        allocated_storage: 20,
        max_allocated_storage: 100,
        multi_az: false,
        backup_retention_period: 7,
        performance_insights_enabled: false,
        deletion_protection: false,
        skip_final_snapshot: true,
        apply_immediately: true,
      },
    };

    // Load manifest
    const manifest = loadManifest(payload.blueprint);
    expect(manifest).toBeDefined();

    // Find snippet
    const snippet = findSnippet(manifest, payload.snippet);
    expect(snippet).toBeDefined();

    // Validate parameters
    const validatedParams = validateParams(snippet, payload.params);
    expect(validatedParams).toBeDefined();

    // Render template
    const rendered = renderTemplate(snippet.template, validatedParams);
    expect(rendered).toBeDefined();
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered).toContain('test-db');
    expect(rendered).toContain('testdb');
  });

  test('should throw error for non-existent blueprint', () => {
    expect(() => {
      loadManifest('non-existent-blueprint');
    }).toThrow(/Manifest not found/);
  });

  test('should throw error for non-existent snippet', () => {
    const manifest = loadManifest('apigw-lambda-rds');
    expect(() => {
      findSnippet(manifest, 'non-existent-snippet');
    }).toThrow(/Snippet 'non-existent-snippet' not found/);
  });

  test('should throw error for invalid parameters', () => {
    const manifest = loadManifest('apigw-lambda-rds');
    const snippet = findSnippet(manifest, 'rds-module');

    const invalidParams = {
      db_identifier: 'test-db',
      // Missing required params
    };

    expect(() => {
      validateParams(snippet, invalidParams);
    }).toThrow(/Required parameter/);
  });

  test('should generate end-to-end with apigw-lambda-rds', () => {
    const payload = {
      blueprint: 'apigw-lambda-rds',
      snippet: 'rds-module',
      params: {
        db_identifier: 'myapp-dev-db',
        db_name: 'myapp',
        db_subnet_group_name: 'myapp-dev-db-subnets',
        security_group_id: 'sg-12345678',
      },
    };

    const manifest = loadManifest(payload.blueprint);
    const snippet = findSnippet(manifest, payload.snippet);
    const validatedParams = validateParams(snippet, payload.params);
    const rendered = renderTemplate(snippet.template, validatedParams);

    // Verify output contains expected content
    expect(rendered).toContain('myapp-dev-db');
    expect(rendered).toContain('myapp');
    expect(rendered).toContain('aws_db_instance');
    expect(rendered).toContain('postgres');
  });
});
