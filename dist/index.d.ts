declare interface ConnectionConfiguration {
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

declare type JsonArray = Array<JsonValue>;

declare interface JsonObject {
    [key: string]: JsonValue;
}

declare type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

declare type Listener = [string, ListenerCallback];

declare type ListenerCallback = (data: JsonValue) => void;

declare class SerialConnection {
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
    readable(): ReadableStream<Uint8Array<ArrayBufferLike>> | null;
    writable(): WritableStream<Uint8Array<ArrayBufferLike>> | null;
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
