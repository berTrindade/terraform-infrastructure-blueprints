import { describe, test, expect } from '@jest/globals';
import { renderTemplate } from '../scripts/render-template.js';

describe('render-template', () => {
  describe('renderTemplate', () => {
    test('should render template with string values', () => {
      const params = {
        table_name: 'my-table',
        billing_mode: 'PAY_PER_REQUEST',
        hash_key: 'id',
        enable_point_in_time_recovery: true,
        ttl_attribute_name: 'expiresAt',
      };

      const rendered = renderTemplate('dynamodb-table.tf.template', params);
      expect(rendered).toContain('my-table');
      expect(rendered).toContain('PAY_PER_REQUEST');
      expect(rendered).toContain('id');
    });

    test('should render template with number values', () => {
      const params = {
        db_identifier: 'test-db',
        db_name: 'testdb',
        engine_version: '15.4',
        instance_class: 'db.t3.micro',
        allocated_storage: 50,
        max_allocated_storage: 200,
        db_subnet_group_name: 'test-subnets',
        security_group_id: 'sg-123456',
        multi_az: false,
        backup_retention_period: 7,
        performance_insights_enabled: false,
        deletion_protection: false,
        skip_final_snapshot: true,
        apply_immediately: true,
      };

      const rendered = renderTemplate('rds-module.tf.template', params);
      expect(rendered).toContain('50');
      expect(rendered).toContain('200');
      expect(rendered).toContain('7');
    });

    test('should render template with boolean values', () => {
      const params = {
        table_name: 'my-table',
        billing_mode: 'PAY_PER_REQUEST',
        hash_key: 'id',
        enable_point_in_time_recovery: true,
        ttl_attribute_name: '',
      };

      const rendered = renderTemplate('dynamodb-table.tf.template', params);
      expect(rendered).toContain('true');
      expect(rendered).not.toContain('false');
    });

    test('should render template with multiple placeholders', () => {
      const params = {
        queue_name: 'my-queue',
        dlq_name: 'my-dlq',
        message_retention_seconds: 345600,
        visibility_timeout_seconds: 30,
        max_receive_count: 3,
      };

      const rendered = renderTemplate('sqs-queue.tf.template', params);
      expect(rendered).toContain('my-queue');
      expect(rendered).toContain('my-dlq');
      expect(rendered).toContain('345600');
      expect(rendered).toContain('30');
      expect(rendered).toContain('3');
    });

    test('should throw error when placeholder is missing value', () => {
      const params = {
        table_name: 'my-table',
        // Missing other required params
      };

      expect(() => {
        renderTemplate('dynamodb-table.tf.template', params);
      }).toThrow(/Missing parameter/);
    });

    test('should throw error for non-existent template', () => {
      const params = {
        test: 'value',
      };

      expect(() => {
        renderTemplate('non-existent-template.tf.template', params);
      }).toThrow(/Template not found/);
    });

    test('should handle empty string values', () => {
      const params = {
        table_name: 'my-table',
        billing_mode: 'PAY_PER_REQUEST',
        hash_key: 'id',
        enable_point_in_time_recovery: true,
        ttl_attribute_name: '', // Empty string
      };

      const rendered = renderTemplate('dynamodb-table.tf.template', params);
      expect(rendered).toBeDefined();
      expect(rendered.length).toBeGreaterThan(0);
    });

    test('should handle zero values', () => {
      const params = {
        queue_name: 'my-queue',
        dlq_name: 'my-dlq',
        message_retention_seconds: 0,
        visibility_timeout_seconds: 0,
        max_receive_count: 0,
      };

      const rendered = renderTemplate('sqs-queue.tf.template', params);
      expect(rendered).toContain('0');
    });

    test('should preserve template structure', () => {
      const params = {
        table_name: 'my-table',
        billing_mode: 'PAY_PER_REQUEST',
        hash_key: 'id',
        enable_point_in_time_recovery: true,
        ttl_attribute_name: '',
      };

      const rendered = renderTemplate('dynamodb-table.tf.template', params);
      expect(rendered).toContain('resource "aws_dynamodb_table"');
      expect(rendered).toContain('tags = var.tags');
    });
  });
});
