import { test, expect } from 'vitest';
// @ts-expect-error don't care for missing declaration file for test
import { setupSerialConnection } from '../../dist/index.esm.mjs';

test('ESM: setupSerialConnection should be defined', () => {
    expect(setupSerialConnection).toBeDefined();
    expect(typeof setupSerialConnection).toBe('function');
    expect(setupSerialConnection.toString()).toContain('function');
});