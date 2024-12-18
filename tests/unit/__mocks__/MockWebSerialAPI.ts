import { vi } from 'vitest';

type EventListenerType = (event: Event) => void;

// Mock implementation of the SerialPort interface
export class MockSerialPort implements SerialPort {
    // Properties
    info: SerialPortInfo;
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
    opened: boolean;
    baudRate: number | null;
    signals: SerialOutputSignals;
    eventListeners: Record<string, EventListenerType[]>;

    // Mock functions
    open: (options: SerialOptions) => Promise<void>;
    close: () => Promise<void>;
    getInfo: () => SerialPortInfo;
    setSignals: (signals: SerialOutputSignals) => Promise<void>;
    getSignals: () => Promise<SerialInputSignals>;
    addEventListener: (
        type: string,
        listener: EventListenerType,
        options?: boolean | AddEventListenerOptions
    ) => void;
    removeEventListener: (
        type: string,
        listener: EventListenerType,
        options?: boolean | EventListenerOptions
    ) => void;
    dispatchEvent: (event: Event) => boolean;

    constructor(info: SerialPortInfo = {}) {
        this.info = info;
        this.readable = new ReadableStream<Uint8Array>();
        this.writable = new WritableStream<Uint8Array>();
        this.opened = false;
        this.connected = false;
        this.baudRate = null;
        this.signals = {};
        this.eventListeners = {};

        // Initialize mock functions using vi.fn
        this.open = vi.fn(this._open.bind(this));
        this.close = vi.fn(this._close.bind(this));
        this.getInfo = vi.fn(this._getInfo.bind(this));
        this.setSignals = vi.fn(this._setSignals.bind(this));
        this.getSignals = vi.fn(this._getSignals.bind(this));
        this.addEventListener = vi.fn(this._addEventListener.bind(this));
        this.removeEventListener = vi.fn(this._removeEventListener.bind(this));
        this.dispatchEvent = vi.fn(this._dispatchEvent.bind(this));
    }

    // Actual implementations
    private async _open(options: SerialOptions): Promise<void> {
        this.baudRate = options.baudRate;
        this.opened = true;
    }

    private async _close(): Promise<void> {
        this.opened = false;
    }

    private _getInfo(): SerialPortInfo {
        return this.info;
    }

    private async _setSignals(signals: SerialOutputSignals): Promise<void> {
        this.signals = { ...this.signals, ...signals };
    }

    private async _getSignals(): Promise<SerialInputSignals> {
        return {
            dataCarrierDetect: false,
            clearToSend: false,
            ringIndicator: false,
            dataSetReady: false,
        };
    }

    // EventTarget methods implementations
    private _addEventListener(
        type: string,
        listener: EventListenerType
    ): void {
        if (!this.eventListeners[type]) {
            this.eventListeners[type] = [];
        }
        this.eventListeners[type].push(listener);
    }

    private _removeEventListener(
        type: string,
        listener: EventListenerType
    ): void {
        const listeners = this.eventListeners[type];
        if (!listeners) return;

        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    private _dispatchEvent(event: Event): boolean {
        const listeners = this.eventListeners[event.type] || [];
        for (const listener of listeners) {
            listener.call(this, event);
        }
        return true;
    }

    readonly connected: boolean;

    onconnect(ev: Event): unknown {
        return ev;
    }

    ondisconnect(ev: Event): unknown {
        return ev;
    }

    forget(): Promise<void> {
        return Promise.resolve(undefined);
    }
}

// Mock implementation of the Serial interface
export class MockWebSerialAPI implements Serial {
    // Properties
    ports: MockSerialPort[];
    eventListeners: Record<string, EventListenerType[]>;

    // Mock functions
    requestPort: (options?: SerialPortRequestOptions) => Promise<SerialPort>;
    getPorts: () => Promise<SerialPort[]>;
    addEventListener: (
        type: string,
        listener: EventListenerType,
        options?: boolean | AddEventListenerOptions
    ) => void;
    removeEventListener: (
        type: string,
        listener: EventListenerType,
        options?: boolean | EventListenerOptions
    ) => void;
    dispatchEvent: (event: Event) => boolean;

    constructor() {
        this.ports = [];
        this.eventListeners = {};

        // Initialize mock functions using vi.fn
        this.requestPort = vi.fn(this._requestPort.bind(this));
        this.getPorts = vi.fn(this._getPorts.bind(this));
        this.addEventListener = vi.fn(this._addEventListener.bind(this));
        this.removeEventListener = vi.fn(this._removeEventListener.bind(this));
        this.dispatchEvent = vi.fn(this._dispatchEvent.bind(this));
    }

    // Actual implementations
    private async _requestPort(
        options: SerialPortRequestOptions = {}
    ): Promise<SerialPort> {
        const filter = options.filters?.[0];
        const portInfo: SerialPortInfo = {
            usbVendorId: filter?.usbVendorId ?? 0x1234,
            usbProductId: filter?.usbProductId ?? 0x5678,
            bluetoothServiceClassId: filter?.bluetoothServiceClassId,
        };

        const port = new MockSerialPort(portInfo);
        this.ports.push(port);
        return port;
    }

    private async _getPorts(): Promise<SerialPort[]> {
        return this.ports;
    }

    // EventTarget methods implementations
    private _addEventListener(
        type: string,
        listener: EventListenerType
    ): void {
        if (!this.eventListeners[type]) {
            this.eventListeners[type] = [];
        }
        this.eventListeners[type].push(listener);
    }

    private _removeEventListener(
        type: string,
        listener: EventListenerType
    ): void {
        const listeners = this.eventListeners[type];
        if (!listeners) return;

        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    private _dispatchEvent(event: Event): boolean {
        const listeners = this.eventListeners[event.type] || [];
        for (const listener of listeners) {
            listener.call(this, event);
        }
        return true;
    }

    onconnect(ev: Event): unknown {
        return ev;
    }

    ondisconnect(ev: Event): unknown {
        return ev;
    }
}
