export const DEFAULT_BAUDRATE = 57600;

interface ConnectionConfiguration {
    baudRate: number;
    requestElement: HTMLElement | string | null;
    requestAccessOnPageLoad: boolean;
    accessText: string;
    accessButtonLabel: string;
    styleDomElements: boolean;
    transformer: Transformer<string, string>;
    logIncomingSerialData: boolean;
    logOutgoingSerialData: boolean;
    parseStringsAsNumbers: boolean;
    warnAboutUnregisteredEvents: boolean;
    newLineCharacter: string;
    filters: SerialPortFilter[];
}

type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonObject
    | JsonArray;

interface JsonObject {
    [key: string]: JsonValue;
}

type JsonArray = Array<JsonValue>;

type ListenerCallback = (data: JsonValue) => void;
type Listener = [string, ListenerCallback];
type Listeners = Record<string, ListenerCallback[]>;

class LineBreakTransformer implements Transformer<string, string> {
    private chunks: string;

    constructor() {
        this.chunks = '';
    }

    transform(chunk: string, controller: TransformStreamDefaultController<string>): void {
        try {
            this.chunks += chunk;
            const lines = this.chunks.split('\r\n');
            this.chunks = lines.pop() || '';
            for (const line of lines) {
                controller.enqueue(line);
            }
        } catch (error) {
            console.error(`Transformation Error: ${error}`);
        }
    }

    flush(controller: TransformStreamDefaultController<string>): void {
        try {
            if (this.chunks) {
                controller.enqueue(this.chunks);
            }
        } catch (error) {
            console.error(`Flushing Error: ${error}`);
        }
    }
}

// Function to parse values as numbers if possible
export function parseAsNumber(value: JsonValue): JsonValue {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && !Number.isNaN(+value) && value.trim() !== '') return parseFloat(value);
    if (Array.isArray(value)) return value.map(item => parseAsNumber(item));
    if (typeof value === 'object' && value !== null) {
        return Object.keys(value).reduce((acc: { [key: string]: JsonValue }, key) => {
            acc[key] = parseAsNumber(value[key]);
            return acc;
        }, {});
    }
    return value;
}

// Factory function to create the default configuration object
export function createDefaultConstructorObject(): ConnectionConfiguration {
    return {
        baudRate: DEFAULT_BAUDRATE,
        requestElement: null,
        requestAccessOnPageLoad: false,
        accessText:
            'To access serial devices, user interaction is required. Please press this button to select the serial device you want to connect to.',
        accessButtonLabel: 'Choose device / port',
        styleDomElements: true,
        transformer: new LineBreakTransformer(),
        logIncomingSerialData: false,
        logOutgoingSerialData: false,
        parseStringsAsNumbers: true,
        warnAboutUnregisteredEvents: true,
        newLineCharacter: '\n',
        filters: [],
    };
}

// Class representing the serial connection
export class SerialConnection {
    private port: SerialPort | null = null;
    private writer: WritableStreamDefaultWriter<string> | null = null;
    private _modalElement: HTMLElement | null = null;
    private _modalErrorElement: HTMLElement | null = null;
    private _listeners: Listeners = {};
    public configuration: ConnectionConfiguration;

    constructor(configuration: ConnectionConfiguration) {
        this.configuration = configuration;
        this.startConnection = this.startConnection.bind(this);
        this.createModal = this.createModal.bind(this);
    }

    public requestSerialAccessOnClick(element: string | HTMLElement): void {
        if (typeof element === 'string') {
            const el = document.getElementById(element);
            if (!el) throw new Error(`Could not find element with ID '${element}'.`);
            element = el;
        }
        element.addEventListener('click', this.startConnection);
    }

    public createModal(): void {
        const [
            modal,
            modalOverlay,
            modalContainer,
            modalInner,
            modalInnerText,
            modalErrorText,
            modalInnerButton,
        ] = ['div', 'div', 'div', 'div', 'p', 'p', 'button'].map(tag => document.createElement(tag));

        modalContainer.classList.add('SimpleWebSerial-modal-container');
        modalOverlay.classList.add('SimpleWebSerial-modal-overlay');
        modalInner.classList.add('SimpleWebSerial-modal-inner');

        if (this.configuration.styleDomElements) {
            modal.setAttribute(
                'style',
                'position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 10000',
            );
            modalOverlay.setAttribute(
                'style',
                'background-color: rgba(0,0,0,.3); position: absolute; left: 0; top: 0; width: 100%; height: 100%; cursor: pointer',
            );
            modalContainer.setAttribute(
                'style',
                'position: absolute; width: 100%; height: auto; padding: 4rem; box-sizing: border-box;',
            );
            modalInner.setAttribute(
                'style',
                'background-color: #fff; border-radius: 4px; padding: 1rem; box-shadow: 0px 2px 11px 4px rgba(0,0,0, .09);',
            );
            modalInnerText.setAttribute('style', 'color: #000');
            modalErrorText.setAttribute('style', 'color: #dd0000');
        }

        modalInnerText.innerText = this.configuration.accessText;
        modalInnerButton.innerText = this.configuration.accessButtonLabel;
        this.requestSerialAccessOnClick(modalInnerButton);
        modalInner.append(modalInnerText, modalErrorText, modalInnerButton);
        modalContainer.append(modalInner);
        modal.append(modalOverlay, modalContainer);

        this._modalElement = modal;
        this._modalErrorElement = modalErrorText;
        document.body.append(modal);
    }

    private showErrorMessageInModal(message: string): void {
        if (!this._modalErrorElement) return;
        this._modalErrorElement.innerHTML = message;
    }

    private removeModal(): void {
        this._modalElement?.remove();
    }

    public async startConnection(): Promise<void> {
        if (this.ready()) throw new Error('Serial connection has already been established.');
        try {
            this.port = await navigator.serial.requestPort({ filters: this.configuration.filters });
            await this.port.open({ baudRate: this.configuration.baudRate });
        } catch (e) {
            this.showErrorMessageInModal(
                'There was an error trying to open a serial connection. ' +
                'Please make sure the port is not occupied in another tab or process. Error message:<br>' +
                e,
            );
            throw e;
        }
        if (this.configuration.requestAccessOnPageLoad) {
            this.removeModal();
        }
        const textEncoder = new TextEncoderStream();
        this.writer = textEncoder.writable.getWriter();

        const decoder = new TextDecoderStream();

        // Piping the streams
        textEncoder.readable.pipeTo(this.port.writable!);
        this.port.readable!.pipeTo(decoder.writable);

        const inputStream = decoder.readable;
        const reader = inputStream
            .pipeThrough(new TransformStream(this.configuration.transformer))
            .getReader();
        this.readLoop(reader).catch(e => {
            console.error(
                'Could not read serial data. Please make sure the same baud rate is used on device (Serial.begin()) and library. Library currently uses baud rate',
                this.configuration.baudRate,
                "Please also make sure you're not sending too much serial data. Consider using (a higher) delay() to throttle the amount of data sent.",
            );
            console.error(e);
        });
    }

    public on(name: string, callback: ListenerCallback): Listener {
        if (!this._listeners[name]) {
            this._listeners[name] = [];
        }
        this._listeners[name].push(callback);
        return [name, callback];
    }

    public removeListener(nameOrListener: string | Listener, callbackToRemove?: ListenerCallback): boolean {
        let name: string;
        if (Array.isArray(nameOrListener) && callbackToRemove === undefined) {
            [name, callbackToRemove] = nameOrListener;
        } else if (typeof nameOrListener === 'string' && callbackToRemove !== undefined) {
            name = nameOrListener;
        } else {
            throw new Error('Invalid arguments for removeListener.');
        }

        if (!this._listeners[name]) {
            throw new Error('There is no listener named ' + name + '.');
        }
        const length = this._listeners[name].length;
        this._listeners[name] = this._listeners[name].filter(listener => listener !== callbackToRemove);
        return length !== this._listeners[name].length;
    }

    public removeListeners(name: string): boolean {
        if (typeof name !== 'string') {
            throw new Error(
                'removeListeners expects a string as parameter, which will be used to remove all listeners of that event.',
            );
        }
        const length = this._listeners[name]?.length || 0;
        this._listeners[name] = [];
        return length > 0;
    }

    public ready(): boolean {
        return !!(this.port?.readable && this.port?.writable);
    }

    public readable(): ReadableStream<Uint8Array<ArrayBufferLike>> | null {
        return this.port?.readable || null;
    }

    public writable(): WritableStream<Uint8Array<ArrayBufferLike>> | null {
        return this.port?.writable || null;
    }

    public async send(name: string, data?: JsonValue): Promise<void> {
        if (!this.port?.writable || !this.writer) return;
        let messageToSend;

        if (data === undefined) {
            if (this.configuration.logOutgoingSerialData) {
                console.log(name);
            }
            if (this.configuration.parseStringsAsNumbers) {
                name = parseAsNumber(name) as string;
            }
            messageToSend = ['_d', name];
        } else {
            if (this.configuration.parseStringsAsNumbers) {
                data = parseAsNumber(data);
            }
            messageToSend = [name, data];
        }

        const stringified = JSON.stringify(messageToSend);
        if (this.configuration.logOutgoingSerialData) {
            console.log(stringified);
        }

        await this.writer.write(stringified + this.configuration.newLineCharacter);
    }

    public async sendEvent(name: string): Promise<void> {
        await this.send('_e', name);
    }

    public async sendData(data: JsonValue): Promise<void> {
        await this.send('_d', data);
    }

    public emit(name: string, data: JsonValue): void {
        if (this._listeners[name]) {
            this._listeners[name].forEach(callback => callback(data));
        } else if (this.configuration.warnAboutUnregisteredEvents) {
            console.warn('Event ' + name + ' has been received, but it has never been registered as listener.');
        }
    }

    private async readLoop(reader: ReadableStreamDefaultReader<string>): Promise<void> {
        while (true) {
            const { value, done } = await reader.read();
            if (value) {
                let json: JsonValue = null;
                try {
                    json = JSON.parse(value);
                } catch {
                    // Ignore bad reads
                }
                if (json) {
                    if (this.configuration.logIncomingSerialData) {
                        console.log(json);
                    }
                    // Handling special events
                    if (Array.isArray(json)) {
                        switch (json[0]) {
                            case '_w':
                                console.warn('[ARDUINO] ' + json[1]);
                                continue;
                            case '_l':
                                console.log('[ARDUINO] ' + json[1]);
                                continue;
                            case '_e':
                                console.error('[ARDUINO] ' + json[1]);
                                continue;
                            case '_d':
                                this.emit('data', json[1]);
                                continue;
                            default:
                                this.emit(json[0] as string, json[1]);
                                continue;
                        }
                    } else if (typeof json === 'string') {
                        this.emit(json, null);
                    }
                } else {
                    if (this.configuration.logIncomingSerialData) {
                        console.log(value);
                    }
                }
            }
            if (done) {
                console.log('[readLoop] DONE', done);
                reader.releaseLock();
                break;
            }
        }
    }

    public getPort(): SerialPort | null {
        return this.port;
    }

    public getWriter(): WritableStreamDefaultWriter<string> | null {
        return this.writer;
    }

    public setWriter(newWriter: WritableStreamDefaultWriter<string>): WritableStreamDefaultWriter<string> {
        this.writer = newWriter;
        return this.writer;
    }

    public get modalElement(): HTMLElement | null {
        return this._modalElement;
    }
}

// Function to set up the serial connection
export function setupSerialConnection(
    args?: number | Partial<ConnectionConfiguration>,
): SerialConnection {
    if (!navigator.serial) {
        throw new Error(
            "The Serial API is not supported in your browser. Make sure you've enabled flags if necessary!",
        );
    }

    let configuration: ConnectionConfiguration;
    if (typeof args === 'number') {
        configuration = { ...createDefaultConstructorObject(), baudRate: args };
    } else if (typeof args === 'undefined') {
        configuration = createDefaultConstructorObject();
    } else if (typeof args === 'object') {
        configuration = { ...createDefaultConstructorObject(), ...args };
    } else {
        throw new Error('Invalid arguments for setupSerialConnection.');
    }

    if (configuration.requestElement != null) {
        configuration = { ...configuration, requestAccessOnPageLoad: false };
    }

    const instance = new SerialConnection(configuration);

    // If a button or an ID was supplied, attach an event listener to it.
    if (configuration.requestElement) {
        instance.requestSerialAccessOnClick(configuration.requestElement);
    }

    // If the library should handle requesting access to the serial device, create a modal on page load.
    if (configuration.requestAccessOnPageLoad) {
        window.addEventListener('load', instance.createModal);
    }

    return instance;
}