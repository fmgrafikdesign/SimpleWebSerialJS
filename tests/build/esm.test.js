import { test, expect } from 'vitest';
import { setupSerialConnection } from '../../dist/index.esm.mjs';

test('ESM: setupSerialConnection should be defined', () => {
    expect(setupSerialConnection).toBeDefined();
});