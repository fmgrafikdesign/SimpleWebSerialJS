// mockWebSerialAPI.js
import { vi } from 'vitest';

// Mock implementation of the SerialPort interface
class MockSerialPort {
    constructor(info = {}) {
        this.info = info;
        this.readable = new ReadableStream();
        this.writable = new WritableStream();
        this.opened = false;
        this.baudRate = null;
        this.signals = {};
        this.eventListeners = {};

        // Mock functions
        this.open = vi.fn(this._open.bind(this));
        this.close = vi.fn(this._close.bind(this));
        this.getInfo = vi.fn(this._getInfo.bind(this));
        this.setSignals = vi.fn(this._setSignals.bind(this));
        this.getSignals = vi.fn(this._getSignals.bind(this));

        // EventTarget methods
        this.addEventListener = vi.fn(this._addEventListener.bind(this));
        this.removeEventListener = vi.fn(this._removeEventListener.bind(this));
        this.dispatchEvent = vi.fn(this._dispatchEvent.bind(this));
    }

    // Actual implementations
    async _open(options) {
        this.baudRate = options.baudRate;
        this.opened = true;
    }

    async _close() {
        this.opened = false;
    }

    _getInfo() {
        return this.info;
    }

    async _setSignals(signals) {
        this.signals = { ...this.signals, ...signals };
    }

    async _getSignals() {
        return this.signals;
    }

    // EventTarget methods implementations
    _addEventListener(type, listener) {
        if (!this.eventListeners[type]) {
            this.eventListeners[type] = [];
        }
        this.eventListeners[type].push(listener);
    }

    _removeEventListener(type, listener) {
        if (!this.eventListeners[type]) return;

        const index = this.eventListeners[type].indexOf(listener);
        if (index !== -1) {
            this.eventListeners[type].splice(index, 1);
        }
    }

    _dispatchEvent(event) {
        const listeners = this.eventListeners[event.type] || [];
        for (const listener of listeners) {
            listener.call(this, event);
        }
    }
}

// Mock implementation of the Serial interface
export class MockWebSerialAPI {
    constructor() {
        this.ports = [];
        this.eventListeners = {};

        // Mock functions
        this.requestPort = vi.fn(this._requestPort.bind(this));
        this.getPorts = vi.fn(this._getPorts.bind(this));

        // EventTarget methods
        this.addEventListener = vi.fn(this._addEventListener.bind(this));
        this.removeEventListener = vi.fn(this._removeEventListener.bind(this));
        this.dispatchEvent = vi.fn(this._dispatchEvent.bind(this));
    }

    // Actual implementations
    async _requestPort(options = {}) {
        // Simulate user selecting a port
        const port = new MockSerialPort({
            usbVendorId: options.filters?.[0]?.usbVendorId || 0x1234,
            usbProductId: options.filters?.[0]?.usbProductId || 0x5678,
        });
        this.ports.push(port);
        return port;
    }

    async _getPorts() {
        // Return the list of connected ports
        return this.ports;
    }

    // EventTarget methods implementations
    _addEventListener(type, listener) {
        if (!this.eventListeners[type]) {
            this.eventListeners[type] = [];
        }
        this.eventListeners[type].push(listener);
    }

    _removeEventListener(type, listener) {
        if (!this.eventListeners[type]) return;

        const index = this.eventListeners[type].indexOf(listener);
        if (index !== -1) {
            this.eventListeners[type].splice(index, 1);
        }
    }

    _dispatchEvent(event) {
        const listeners = this.eventListeners[event.type] || [];
        for (const listener of listeners) {
            listener.call(this, event);
        }
    }
}
