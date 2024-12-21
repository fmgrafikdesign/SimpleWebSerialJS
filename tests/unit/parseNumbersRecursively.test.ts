import { describe, it, expect } from 'vitest';
import { parseNumbersRecursively } from '../../src/SimpleWebSerial';

describe('parseNumbersRecursively', () => {
    it('should return the same number if input is a number', () => {
        expect(parseNumbersRecursively(42)).toBe(42);
    });

    it('should parse numeric strings into numbers', () => {
        expect(parseNumbersRecursively('42')).toBe(42);
        expect(parseNumbersRecursively('3.14')).toBe(3.14);
    });

    it('should not parse non-numeric strings', () => {
        expect(parseNumbersRecursively('hello')).toBe('hello');
        expect(parseNumbersRecursively('123abc')).toBe('123abc');
    });

    it('should return the same value for an empty string', () => {
        expect(parseNumbersRecursively('')).toBe('');
    });

    it('should handle an array with mixed types', () => {
        expect(parseNumbersRecursively(['1', '2', 3, 'hello'])).toEqual([1, 2, 3, 'hello']);
    });

    it('should recursively parse numbers within objects', () => {
        const input = {
            a: '1',
            b: {
                c: '3.14',
                d: 'not a number'
            }
        };
        const expected = {
            a: 1,
            b: {
                c: 3.14,
                d: 'not a number'
            }
        };
        expect(parseNumbersRecursively(input)).toEqual(expected);
    });

    it('should handle nested arrays and objects', () => {
        const input = {
            a: ['1', '2', { b: '3' }],
            c: '4'
        };
        const expected = {
            a: [1, 2, { b: 3 }],
            c: 4
        };
        expect(parseNumbersRecursively(input)).toEqual(expected);
    });

    it('should return null as is', () => {
        expect(parseNumbersRecursively(null)).toBe(null);
    });

    it('should parse scientific notation strings into numbers', () => {
        expect(parseNumbersRecursively('1e3')).toBe(1000);
        expect(parseNumbersRecursively('2.5e-3')).toBe(0.0025);
    });

    it('should parse strings with leading and trailing spaces', () => {
        expect(parseNumbersRecursively('  42 ')).toBe(42);
        expect(parseNumbersRecursively(' \t\n3.14\n\t ')).toBe(3.14);
    });

    it('should handle an array of empty strings', () => {
        expect(parseNumbersRecursively(['', ' '])).toEqual(['', ' ']);
    });

    it('should handle deeply nested structures', () => {
        const input = {
            level1: {
                level2: {
                    level3: '123',
                }
            }
        };
        const expected = {
            level1: {
                level2: {
                    level3: 123,
                }
            }
        };
        expect(parseNumbersRecursively(input)).toEqual(expected);
    });

    it('should return non-parseable primitive values as they are', () => {
        expect(parseNumbersRecursively(true)).toBe(true);
        expect(parseNumbersRecursively(false)).toBe(false);
        expect(parseNumbersRecursively(NaN)).toBe(NaN);
        expect(parseNumbersRecursively(Infinity)).toBe(Infinity);
    });

    it('should handle mixed-type objects containing arrays', () => {
        const input = {
            numbers: ['1', 2, '3'],
            strings: ['a', 'b'],
            mixed: ['42', false, 7.5]
        };
        const expected = {
            numbers: [1, 2, 3],
            strings: ['a', 'b'],
            mixed: [42, false, 7.5]
        };
        expect(parseNumbersRecursively(input)).toEqual(expected);
    });
});
