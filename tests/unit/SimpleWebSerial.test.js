/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupSerialConnection } from '../../src';
import {MockWebSerialAPI} from './__mocks__/MockWebSerialAPI';
import {createDefaultConstructorObject} from '../../src/SimpleWebSerial';
// Import the mock implementation

// Mock the navigator.serial API
beforeEach(() => {
    Object.defineProperty(window.navigator, 'serial', {
        value: new MockWebSerialAPI(),
        configurable: true, // Allow redefining for different tests
    });
});

// Mock DOM elements for testing
const mockButtonElement = {
    addEventListener: vi.fn(),
};

// Mock document.getElementById
vi.spyOn(document, 'getElementById').mockImplementation((id) => {
    if (id === 'test-button') {
        return mockButtonElement;
    }
    return null;
});

// Mock window.addEventListener
vi.spyOn(window, 'addEventListener').mockImplementation(vi.fn());

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
});

describe('setupSerialConnection', () => {
    it('should initialize with default values when no args are provided', () => {
        const instance = setupSerialConnection();
        expect(instance).toBeDefined();
        expect(instance.getPort()).toBeNull();
        expect(instance.ready()).toBeFalsy();

        expect(instance.configuration).toEqual(createDefaultConstructorObject());
    });

    it('should initialize with custom baudRate when a number is provided', () => {
        const instance = setupSerialConnection(115200);
        expect(instance).toBeDefined();
        expect(instance.getPort()).toBeNull();
        expect(instance.ready()).toBeFalsy();
        // Internal configuration should have the custom baudRate
        expect(instance.configuration).toEqual({
            ...createDefaultConstructorObject(),
            baudRate: 115200,
        });
    });

    it('should initialize with custom configuration object', () => {
        const customConfig = {
            baudRate: 38400,
            logIncomingSerialData: true,
            requestAccessOnPageLoad: true,
        };
        const instance = setupSerialConnection(customConfig);
        expect(instance).toBeDefined();
        expect(instance.getPort()).toBeNull();
        expect(instance.ready()).toBeFalsy();
        expect(instance.configuration).toEqual({
            ...createDefaultConstructorObject(),
            baudRate: 38400,
            logIncomingSerialData: true,
            requestAccessOnPageLoad: true,
        });
        // Verify that window.addEventListener was called for 'load' event
        expect(window.addEventListener).toHaveBeenCalledWith('load', instance.createModal);
    });

    it('should attach event listener to requestElement when provided', () => {
        const instance = setupSerialConnection({
            requestElement: 'test-button',
        });
        expect(document.getElementById).toHaveBeenCalledWith('test-button');
        expect(mockButtonElement.addEventListener).toHaveBeenCalledWith('click', instance.startConnection);
        // Since requestElement is provided, requestAccessOnPageLoad should be false
        expect(instance.configuration.requestAccessOnPageLoad).toBe(false);
    });

    it('should throw an error if navigator.serial is not available', () => {
        // Temporarily remove navigator.serial
        Object.defineProperty(navigator, 'serial', {
            value: undefined,
            configurable: true,
        });

        expect(() => setupSerialConnection()).toThrow(
            'The Serial API is not supported in your browser. Make sure you\'ve enabled flags if necessary!'
        );
    });
});

describe('Connection Instance Methods', () => {
    let instance;

    beforeEach(() => {
        instance = setupSerialConnection();
    });

    it('should start connection when startConnection is called', async () => {
        await instance.startConnection();
        console.log(instance.getPort());
        expect(navigator.serial.requestPort).toHaveBeenCalledWith({ filters: [] });
        expect(instance.getPort()).toBeDefined();
        console.log('instance', instance);
        expect(instance.getPort().open).toHaveBeenCalledWith({ baudRate: 57600 });
        expect(instance.ready()).toBeTruthy();
    });

    it('should send data when send is called', async () => {
        await instance.startConnection();
        // Mock writer.write
        const mockWrite = vi.fn();
        instance.setWriter({
            write: mockWrite,
        });
        await instance.send('test-event', { key: 'value' });
        const expectedData = JSON.stringify(['test-event', { key: 'value' }]) + '\n';
        expect(mockWrite).toHaveBeenCalledWith(expectedData);
    });

    it('should parse strings as numbers when parseStringsAsNumbers is true', async () => {
        await instance.startConnection();
        instance.configuration.parseStringsAsNumbers = true;
        const mockWrite = vi.fn();
        instance.setWriter({
            write: mockWrite,
        });
        await instance.send('some-event', '3.14');
        const expectedData = JSON.stringify(['some-event', 3.14]) + '\n';
        expect(mockWrite).toHaveBeenCalledWith(expectedData);
    });

    it('should not parse strings as numbers when parseStringsAsNumbers is false', async () => {
        await instance.startConnection();
        instance.configuration.parseStringsAsNumbers = false;
        const mockWrite = vi.fn();
        instance.setWriter({
            write: mockWrite,
        });
        await instance.send('42', '3.14');
        const expectedData = JSON.stringify(['42', '3.14']) + '\n';
        expect(mockWrite).toHaveBeenCalledWith(expectedData);
    });

    it('should add and emit events correctly', () => {
        const mockCallback = vi.fn();
        instance.on('test-event', mockCallback);
        instance.emit('test-event', { data: 'value' });
        expect(mockCallback).toHaveBeenCalledWith({ data: 'value' });
    });

    it('should remove listeners correctly', () => {
        const mockCallback = vi.fn();
        const listener = instance.on('test-event', mockCallback);
        const removed = instance.removeListener(listener);
        expect(removed).toBe(true);
        instance.emit('test-event', { data: 'value' });
        expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should remove all listeners of an event', () => {
        const mockCallback1 = vi.fn();
        const mockCallback2 = vi.fn();
        instance.on('test-event', mockCallback1);
        instance.on('test-event', mockCallback2);
        const removed = instance.removeListeners('test-event');
        expect(removed).toBe(true);
        instance.emit('test-event', { data: 'value' });
        expect(mockCallback1).not.toHaveBeenCalled();
        expect(mockCallback2).not.toHaveBeenCalled();
    });

    it('should warn about unregistered events if configuration permits', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        instance.configuration.warnAboutUnregisteredEvents = true;
        instance.emit('unregistered-event', { data: 'value' });
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'Event unregistered-event has been received, but it has never been registered as listener.'
        );
        consoleWarnSpy.mockRestore();
    });

    it('should not warn about unregistered events if configuration prohibits', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        instance.configuration.warnAboutUnregisteredEvents = false;
        instance.emit('unregistered-event', { data: 'value' });
        expect(consoleWarnSpy).not.toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
    });
});