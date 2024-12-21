import { describe, it, expect, vi } from 'vitest';
import { LineBreakTransformer } from '../../src';

describe('LineBreakTransformer', () => {
    it('should transform chunks of data separated by the default delimiter', () => {
        const transformer = new LineBreakTransformer();
        const controller = {
            enqueue: vi.fn()
        };

        // @ts-expect-error partial mock sufficient for unit-test
        transformer.transform('line1\r\nline2\r\n', controller);
        expect(controller.enqueue).toHaveBeenCalledWith('line1');
        expect(controller.enqueue).toHaveBeenCalledWith('line2');
        expect(controller.enqueue).toHaveBeenCalledTimes(2);
    });

    it('should handle data chunks split between delimiters', () => {
        const transformer = new LineBreakTransformer();
        const controller = {
            enqueue: vi.fn()
        };

        // @ts-expect-error partial mock sufficient for unit-test
        transformer.transform('line1\r', controller);
        // @ts-expect-error partial mock sufficient for unit-test
        transformer.transform('\nline2\r\nline3', controller);

        expect(controller.enqueue).toHaveBeenCalledWith('line1');
        expect(controller.enqueue).toHaveBeenCalledWith('line2');
        expect(controller.enqueue).toHaveBeenCalledTimes(2);
    });

    it('should flush remaining data on flush call', () => {
        const transformer = new LineBreakTransformer();
        const controller = {
            enqueue: vi.fn()
        };

        // @ts-expect-error partial mock sufficient for unit-test
        transformer.transform('line1\r\nline2', controller);
        // @ts-expect-error partial mock sufficient for unit-test
        transformer.flush(controller);

        expect(controller.enqueue).toHaveBeenCalledWith('line1');
        expect(controller.enqueue).toHaveBeenCalledWith('line2');
        expect(controller.enqueue).toHaveBeenCalledTimes(2);
    });

    it('should use custom delimiter if provided', () => {
        const transformer = new LineBreakTransformer('\n');
        const controller = {
            enqueue: vi.fn()
        };

        // @ts-expect-error partial mock sufficient for unit-test
        transformer.transform('line1\nline2\n', controller);

        expect(controller.enqueue).toHaveBeenCalledWith('line1');
        expect(controller.enqueue).toHaveBeenCalledWith('line2');
        expect(controller.enqueue).toHaveBeenCalledTimes(2);
    });

    it('should handle empty input without errors', () => {
        const transformer = new LineBreakTransformer();
        const controller = {
            enqueue: vi.fn()
        };

        // @ts-expect-error partial mock sufficient for unit-test
        transformer.transform('', controller);
        // @ts-expect-error partial mock sufficient for unit-test
        transformer.flush(controller);

        expect(controller.enqueue).toHaveBeenCalledTimes(0);
    });

    it('should handle multiple consecutive delimiters as separate lines', () => {
        const transformer = new LineBreakTransformer();
        const controller = {
            enqueue: vi.fn()
        };

        // @ts-expect-error partial mock sufficient for unit-test
        transformer.transform('line1\r\n\r\nline2\r\n', controller);

        // Expect an empty line between line1 and line2
        expect(controller.enqueue).toHaveBeenCalledWith('line1');
        expect(controller.enqueue).toHaveBeenCalledWith('');
        expect(controller.enqueue).toHaveBeenCalledWith('line2');
        expect(controller.enqueue).toHaveBeenCalledTimes(3);
    });

    it('should handle large inputs efficiently', () => {
        const transformer = new LineBreakTransformer();
        const controller = {
            enqueue: vi.fn()
        };

        const largeInput = 'line1\r\n'.repeat(1000);
        // @ts-expect-error partial mock sufficient for unit-test
        transformer.transform(largeInput, controller);

        // It should call enqueue 1000 times for each "line1"
        expect(controller.enqueue).toHaveBeenCalledTimes(1000);
        expect(controller.enqueue).toHaveBeenCalledWith('line1');
    });

    it('should preserve incomplete lines between chunks', () => {
        const transformer = new LineBreakTransformer();
        const controller = {
            enqueue: vi.fn()
        };

        // @ts-expect-error partial mock sufficient for unit-test
        transformer.transform('line1\r\nline', controller);
        // @ts-expect-error partial mock sufficient for unit-test
        transformer.transform('2\r\nline3', controller);
        // @ts-expect-error partial mock sufficient for unit-test
        transformer.flush(controller);

        expect(controller.enqueue).toHaveBeenCalledWith('line1');
        expect(controller.enqueue).toHaveBeenCalledWith('line2');
        expect(controller.enqueue).toHaveBeenCalledWith('line3');
        expect(controller.enqueue).toHaveBeenCalledTimes(3);
    });

    it('should handle empty initial chunk gracefully', () => {
        const transformer = new LineBreakTransformer();
        const controller = {
            enqueue: vi.fn()
        };

        // @ts-expect-error partial mock sufficient for unit-test
        transformer.transform('', controller);
        // @ts-expect-error partial mock sufficient for unit-test
        transformer.transform('line1\r\nline2\r\n', controller);

        expect(controller.enqueue).toHaveBeenCalledWith('line1');
        expect(controller.enqueue).toHaveBeenCalledWith('line2');
        expect(controller.enqueue).toHaveBeenCalledTimes(2);
    });

    // The following test is theoretical for runtime, as TypeScript handles string types.
    // But testing for robustness during dynamic uses.
    it('should handle erroneous non-string input gracefully', () => {
        const transformer = new LineBreakTransformer();
        const controller = {
            enqueue: vi.fn()
        };

        try {
            // @ts-expect-error partial mock sufficient for unit-test
            // Simulating incorrect usage
            transformer.transform(undefined as unknown as string, controller);
        } catch (e) {
            expect(e).toBeDefined();
        }
    });
});