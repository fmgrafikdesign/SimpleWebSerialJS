export declare interface ConnectionConfiguration {
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

/** Default baudrate (57600) for serial communication. Common for many Arduino boards. */
export declare const DEFAULT_BAUDRATE = 57600;

export declare type JsonArray = Array<JsonValue>;

export declare interface JsonObject {
    [key: string]: JsonValue;
}

export declare type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

export declare class LineBreakTransformer implements Transformer<string, string> {
    private chunks;
    private delimiter;
    constructor(delimiter?: string);
    transform(chunk: string, controller: TransformStreamDefaultController<string>): void;
    flush(controller: TransformStreamDefaultController<string>): void;
}

export declare type Listener = [string, ListenerCallback];

export declare type ListenerCallback = (data: JsonValue) => void;

export declare type Listeners = Record<string, ListenerCallback[]>;

export declare class SerialConnection {
    private port;
    private writer;
    private _modalElement;
    private _modalErrorElement;
    private _listeners;
    configuration: ConnectionConfiguration;
    constructor(configuration: ConnectionConfiguration);
    requestSerialAccessOnClick(element: string | HTMLElement): void;
    createModal(): void;
    private showErrorMessageInModal;
    private removeModal;
    startConnection(): Promise<void>;
    on(name: string, callback: ListenerCallback): Listener;
    removeListener(nameOrListener: string | Listener, callbackToRemove?: ListenerCallback): boolean;
    removeListeners(name: string): boolean;
    ready(): boolean;
    readable(): ReadableStream<Uint8Array> | null;
    writable(): WritableStream<Uint8Array> | null;
    send(name: string, data?: JsonValue): Promise<void>;
    sendEvent(name: string): Promise<void>;
    sendData(data: JsonValue): Promise<void>;
    emit(name: string, data: JsonValue): void;
    private readLoop;
    getPort(): SerialPort | null;
    getWriter(): WritableStreamDefaultWriter<string> | null;
    setWriter(newWriter: WritableStreamDefaultWriter<string>): WritableStreamDefaultWriter<string>;
    get modalElement(): HTMLElement | null;
}

export declare function setupSerialConnection(args?: number | Partial<ConnectionConfiguration>): SerialConnection;

export { }
