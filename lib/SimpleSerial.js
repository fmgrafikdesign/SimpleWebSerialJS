'use strict';

const DEFAULT_BAUDRATE = 57600;
const NEW_LINE = '\n';

class LineBreakTransformer {
    constructor() {
        // A container for holding stream data until a new line.
        this.chunks = "";
    }

    transform(chunk, controller) {
        // Append new chunks to existing chunks.
        this.chunks += chunk;
        // For each line breaks in chunks, send the parsed lines out.
        const lines = this.chunks.split("\r\n");
        this.chunks = lines.pop();
        lines.forEach((line) => controller.enqueue(line));
    }

    flush(controller) {
        // When the stream is closed, flush any remaining chunks out.
        controller.enqueue(this.chunks);
    }
}

function parseAsNumber(value) {
    if (typeof value == "number") {
        return value;
    } else if (typeof value == "string" && !isNaN(value) && !isNaN(parseFloat(value))) {
        return parseFloat(value);
    } else if (typeof value == "object") {
        // Iterate over keys, return parsed values
        let obj = {};
        Object.keys(value).forEach(key => {
            obj[key] = parseAsNumber(value[key]);
        })
        return obj;
    } else {
        return value;
    }
}

// TODO: Change requestAccessOnPageLoad back to false per default, it's true for debugging purposes
const defaultConstructorObject = {
    baudRate: DEFAULT_BAUDRATE,
    requestButton: false,
    requestAccessOnPageLoad: true,
    accessText: "To access serial devices, user interaction is required. Please press this button to select the port you want to connect to.",
    accessButtonLabel: "Connect to Serial Port",
    styleDomElements: true,
    transformer: new LineBreakTransformer(),
    logIncomingSerialData: false,
    logOutgoingSerialData: false,
    parseStringsAsNumbers: true
}

class SimpleSerial {
    configuration;
    port;
    writer;
    modal;
    _listeners = {};
    _this = this;

    constructor(args) {
        if (!navigator.serial) {
            throw new Error("The Serial API not supported in your browser. Make sure you've enabled flags if necessary!");
        }

        if (typeof args === "number") {
            args = {
                ...defaultConstructorObject,
                baudRate: args
            }
        } else if (typeof args === "undefined") {
            args = defaultConstructorObject;
        } else if (typeof args === 'object') {
            // TODO check for valid configuration object (transformer, HTML Element, ...)

            // constructor object, override defaults
            args = {
                ...defaultConstructorObject,
                ...args
            }
        }

        if (this.configuration.requestButton != null) {
            args = {
                requestAccessOnPageLoad: false,
                ...args
            }
        }

        this.configuration = args;
        console.log("SimpleSerial instance created")

        // If a button or an id was supplied, attach an event listener to it.
        if (this.configuration.requestButton) {
            this.requestSerialAccessOnClick(this.configuration.requestButton);
        }

        // If the library should handle requesting access to the serial device, create a modal on page load.
        if (this.configuration.requestAccessOnPageLoad) {
            window.addEventListener("load", this.createModal.bind(this));
        }
        return this;
    }

    requestSerialAccessOnClick(element) {
        if (typeof element === "string") {
            // Search for HTML Element with this id
            const el = document.getElementById(element)
            if (!el) throw "Could not find element with ID '" + element + "'."
            element = el;
        }
        element.addEventListener("click", this.connect.bind(this))
    }

    createModal() {
        this.modal = document.createElement("div");

        const modalOverlay = document.createElement("div");
        this.configuration.styleDomElements ? modalOverlay.setAttribute("style", "background-color: rgba(0,0,0,.3); position: absolute; width: 100%; height: 100%; left: 0; top: 0; cursor: pointer") : null;
        modalOverlay.classList.add("SimpleSerial-modal-overlay");

        const modalContainer = document.createElement("div");
        this.configuration.styleDomElements ? modalContainer.setAttribute("style", "position: absolute; width: 100%; height: auto; padding: 4rem; box-sizing: border-box; ") : null;
        modalContainer.classList.add("SimpleSerial-modal-container");

        const modalInner = document.createElement("div");
        this.configuration.styleDomElements ? modalInner.setAttribute("style", "background-color: #fff; border-radius: 4px; padding: 1rem; box-shadow: 0px 2px 11px 4px rgba(0,0,0, .09);") : null;
        modalInner.classList.add("SimpleSerial-modal-inner");

        const modalInnerText = document.createElement("p");
        this.configuration.styleDomElements ? modalInnerText.setAttribute("style", "color: #000") : null;
        modalInnerText.innerText = this.configuration.accessText;

        const modalInnerButton = document.createElement("button");
        modalInnerButton.innerText = this.configuration.accessButtonLabel;
        this.requestSerialAccessOnClick(modalInnerButton);

        modalInner.append(modalInnerText, modalInnerButton);
        modalContainer.append(modalInner);
        this.modal.append(modalOverlay, modalContainer);

        document.body.append(this.modal);
        return this.modal;
    }

    removeModal() {
        this.modal.remove();
    }

    async connect() {
        console.log("connect called!");
        this.port = await navigator.serial.requestPort();
        await this.port.open({
            baudRate: this.configuration.baudRate
        })
        if (this.configuration.requestAccessOnPageLoad) {
            this.removeModal();
        }
        const textEncoder = new TextEncoderStream();
        const writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
        this.writer = textEncoder.writable.getWriter();
        let decoder = new TextDecoderStream();
        const readableStreamClosed = this.port.readable.pipeTo(decoder.writable)
        const inputStream = decoder.readable;
        const reader = decoder.readable
            .pipeThrough(new TransformStream(this.configuration.transformer))
            .getReader()
        await this.readLoop(reader);
    }

    on(name, callback) {
        if (!this._listeners[name]) {
            this._listeners[name] = [];
        }
        this._listeners[name].push(callback);
        return [name, callback];
    }

    removeListener(name, callbackToRemove) {
        if (typeof name == "object" && typeof callbackToRemove == "undefined") {
            callbackToRemove = name[1]
            name = name[0];
        }

        if (!this._listeners[name]) {
            throw new Error('There is no listener named ' + name + '.')
        }

        let length = this._listeners[name].length

        this._listeners[name] = this._listeners[name].filter((listener) => listener !== callbackToRemove);
        return length !== this._listeners[name].length;
    }

    // Remove all listeners of event name
    removeListeners(name) {
        if (typeof name !== "string") {
            throw new Error("removeListeners expects a string as parameter, which will be used to remove all listeners of that event.");
        }
        const length = this._listeners[name].length
        this._listeners[name] = [];
        return length > 0;
    }

    async send(name, data) {
        // If only 1 parameter is supplied, it's raw data.
        if (typeof data === "undefined") {
            if (this.configuration.logOutgoingSerialData) {
                console.log(name);
            }

            if (this.configuration.parseStringsAsNumbers) {
                name = parseAsNumber(name);
            }

            return this.sendData(name);
        }

        // If data is an object, parse its keys as ints
        if (this.configuration.parseStringsAsNumbers) {
            data = parseAsNumber(data);
        }

        const event = [name, data]
        const stringified = JSON.stringify(event);
        if (this.configuration.logOutgoingSerialData) {
            console.log(stringified);
        }
        return this.writer.write(stringified + NEW_LINE);
    }

    async sendEvent(name) {
        return this.send("_e", name);
    }

    async sendData(data) {
        return this.send("_d", data);
    }

    emit(name, data) {
        if (!this._listeners[name]) {
            return console.warn('Event ' + name + ' has been emitted, but it has never been registered as listener.');
        }
        this._listeners[name].forEach(callback => callback(data))
    }

    async readLoop(reader) {
        while (true) {
            const {value, done} = await reader.read();
            if (value) {
                // Use vanilla for as it's faster than forEach
                // TODO check and validate value as valid JSON
                let json = null;
                try {
                    json = JSON.parse(value)
                } catch (e) {
                    // console.error(e);
                }
                if (json) {
                    if (this.configuration.logIncomingSerialData) {
                        console.log(json);
                    }
                    // If it's an array, handle accordingly
                    if (typeof json == "object") {
                        if (json[0] === "_w") {
                            console.warn("[ARDUINO] " + json[1]);
                            continue;
                        }

                        // Reserved event name 'd': Data transfer. Register a listener "data" to listen to it.
                        if (json[0] === "_d") {
                            this.emit('data', json[1]);
                            continue;
                        }

                        this.emit(json[0], json[1]);
                    }

                    // If it's just a string, just call the event
                    else if (typeof json == "string") {
                        this.
                        emit(json, null)
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
}
