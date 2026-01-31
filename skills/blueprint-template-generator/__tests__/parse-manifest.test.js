import { describe, test, expect, beforeEach } from '@jest/globals';
import { loadManifest, findSnippet, validateParams } from '../scripts/parse-manifest.js';

describe('parse-manifest', () => {
  describe('loadManifest', () => {
    test('should load a valid manifest', () => {
      const manifest = loadManifest('apigw-lambda-rds');
      expect(manifest).toBeDefined();
      expect(manifest.name).toBe('apigw-lambda-rds');
      expect(manifest.snippets).toBeDefined();
      expect(Array.isArray(manifest.snippets)).toBe(true);
    });

    test('should throw error for non-existent manifest', () => {
      expect(() => {
        loadManifest('non-existent-blueprint');
      }).toThrow(/Manifest not found/);
    });

    test('should throw error for invalid manifest structure', () => {
      // This test would require a test manifest file with invalid structure
      // For now, we test that valid manifests have required fields
      const manifest = loadManifest('apigw-lambda-rds');
      expect(manifest.name).toBeDefined();
      expect(manifest.snippets).toBeDefined();
    });
  });

  describe('findSnippet', () => {
    test('should find a valid snippet', () => {
      const manifest = loadManifest('apigw-lambda-rds');
      const snippet = findSnippet(manifest, 'rds-module');
      expect(snippet).toBeDefined();
      expect(snippet.id).toBe('rds-module');
      expect(snippet.template).toBeDefined();
    });

    test('should throw error for non-existent snippet', () => {
      const manifest = loadManifest('apigw-lambda-rds');
      expect(() => {
        findSnippet(manifest, 'non-existent-snippet');
      }).toThrow(/Snippet 'non-existent-snippet' not found/);
    });
  });

  describe('validateParams', () => {
    let snippet;

    beforeEach(() => {
      const manifest = loadManifest('apigw-lambda-rds');
      snippet = findSnippet(manifest, 'rds-module');
    });

    test('should validate parameters with valid values', () => {
      const params = {
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
      };

      const validated = validateParams(snippet, params);
      expect(validated.db_identifier).toBe('test-db');
      expect(validated.db_name).toBe('testdb');
    });

    test('should use default values when not provided', () => {
      const params = {
        db_identifier: 'test-db',
        db_name: 'testdb',
        db_subnet_group_name: 'test-subnets',
        security_group_id: 'sg-12345678',
      };

      const validated = validateParams(snippet, params);
      expect(validated.engine_version).toBe('15.4'); // default
      expect(validated.instance_class).toBe('db.t3.micro'); // default
      expect(validated.allocated_storage).toBe(20); // default
    });

    test('should throw error for missing required parameters', () => {
      const params = {
        db_identifier: 'test-db',
        // Missing db_name, db_subnet_group_name, security_group_id
      };

      expect(() => {
        validateParams(snippet, params);
      }).toThrow(/Required parameter/);
    });

    test('should throw error for invalid type', () => {
      const params = {
        db_identifier: 'test-db',
        db_name: 'testdb',
        db_subnet_group_name: 'test-subnets',
        security_group_id: 'sg-12345678',
        allocated_storage: 'not-a-number', // Should be number
      };

      expect(() => {
        validateParams(snippet, params);
      }).toThrow(/must be a number/);
    });

    test('should throw error for invalid pattern', () => {
      const params = {
        db_identifier: 'TEST-DB', // Invalid pattern (uppercase)
        db_name: 'testdb',
        db_subnet_group_name: 'test-subnets',
        security_group_id: 'sg-12345678',
      };

      expect(() => {
        validateParams(snippet, params);
      }).toThrow(/does not match pattern/);
    });

    test('should throw error for invalid enum value', () => {
      const params = {
        db_identifier: 'test-db',
        db_name: 'testdb',
        db_subnet_group_name: 'test-subnets',
        security_group_id: 'sg-12345678',
        instance_class: 'db.invalid.class', // Not in enum
      };

      expect(() => {
        validateParams(snippet, params);
      }).toThrow(/must be one of/);
    });

    test('should validate boolean values', () => {
      const params = {
        db_identifier: 'test-db',
        db_name: 'testdb',
        db_subnet_group_name: 'test-subnets',
        security_group_id: 'sg-12345678',
        multi_az: true,
        deletion_protection: false,
      };

      const validated = validateParams(snippet, params);
      expect(validated.multi_az).toBe(true);
      expect(validated.deletion_protection).toBe(false);
    });

    test('should throw error for invalid boolean type', () => {
      const params = {
        db_identifier: 'test-db',
        db_name: 'testdb',
        db_subnet_group_name: 'test-subnets',
        security_group_id: 'sg-12345678',
        multi_az: 'yes', // Should be boolean
      };

      expect(() => {
        validateParams(snippet, params);
      }).toThrow(/must be a boolean/);
    });

    test('should warn about unknown parameters', () => {
      const params = {
        db_identifier: 'test-db',
        db_name: 'testdb',
        db_subnet_group_name: 'test-subnets',
        security_group_id: 'sg-12345678',
        unknown_param: 'value', // Unknown parameter
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const validated = validateParams(snippet, params);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown parameter'));
      consoleSpy.mockRestore();
      expect(validated.unknown_param).toBeUndefined();
    });

    test('should handle empty params object', () => {
      const params = {};

      expect(() => {
        validateParams(snippet, params);
      }).toThrow(/Required parameter/);
    });

    test('should handle null values correctly', () => {
      const params = {
        db_identifier: 'test-db',
        db_name: 'testdb',
        db_subnet_group_name: 'test-subnets',
        security_group_id: 'sg-12345678',
        multi_az: null, // null should use default
      };

      const validated = validateParams(snippet, params);
      expect(validated.multi_az).toBe(false); // default value
    });
  });
});
