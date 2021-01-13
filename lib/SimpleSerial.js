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
    parseStringsAsIntegers: true
}

class SimpleSerial {
    configuration;
    port;
    writer;
    modal;
    listeners = [];
    _this = this;

    constructor(args) {
        if (!navigator.serial) {
            throw "Serial API not supported in your browser.";
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

        this.configuration = args;
        console.log("SimpleSerial instance created")

        if (this.configuration.requestAccessOnPageLoad && this.configuration.requestButton) {
            console.warn("Both requestButton and requestAccessOnPageLoad were supplied. Only one of these may exist / be true.")
        }

        // If a button or an id was supplied, attach an event listener to it.
        if (this.configuration.requestButton) {
            if (typeof this.configuration.requestButton === "string") {
                // Search for HTML Element with this id
                const el = document.getElementById(this.configuration.requestButton)
                if (!el) throw "Could not find element with ID '" + this.configuration.requestButton + "'."
                this.configuration.requestButton = el;
            }
            this.configuration.requestButton.addEventListener("click", this.connect.bind(this))
        }

        // If the library should handle requesting access to the serial device, create a modal on page load.
        if (this.configuration.requestAccessOnPageLoad) {
            window.addEventListener("load", this.createModal.bind(this));
        }
        return this;
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
        modalInnerText.innerText = this.configuration.accessText;

        const modalInnerButton = document.createElement("button");
        modalInnerButton.innerText = this.configuration.accessButtonLabel;
        modalInnerButton.addEventListener("click", this.connect.bind(this));

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
        console.log('connect called');
        this.port = await navigator.serial.requestPort();
        await this.port.open({
            baudRate: this.configuration.baudRate
        })
        this.removeModal();
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
        this.listeners.push({name, callback});
    }

    // TODO Test functionality
    removeListener(name, callback) {
        let length = this.listeners.length
        this.listeners.filter(listener => listener.name !== name && listener.callback !== callback)

        return length !== this.listeners.length
    }

    async send(name, data) {
        // If only 1 parameter is supplied, it's raw data.
        if (typeof data === "undefined") {
            if (this.configuration.logOutgoingSerialData) {
                console.log(name);
            }

            // Parse raw data as int
            if (this.configuration.parseStringsAsIntegers) {
                name = parseAsNumber(name);
            }

            return this.writer.write(name + NEW_LINE);
        }

        // If data is an object, parse its keys as ints
        if (this.configuration.parseStringsAsIntegers) {
            data = parseAsNumber(data);
        }

        const event = [name, data]
        const stringified = JSON.stringify(event);
        if (this.configuration.logOutgoingSerialData) {
            console.log(stringified);
        }
        return this.writer.write(stringified + NEW_LINE);
    }

    async readLoop(reader) {
        console.log("read Loop called!");
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
                    if(json[0] === "_w") {
                        console.warn("[ARDUINO] " + json[1]);
                        continue;
                    }

                    if (this.configuration.logIncomingSerialData) {
                        console.log(json);
                    }
                    for (let i = 0; i < this.listeners.length; i++) {
                        if (this.listeners[i].name === json[0]) {
                            this.listeners[i].callback.call(this._this, json[1]);
                        }
                    }
                } else {
                    // TODO Handle pure data
                    if (this.configuration.logIncomingSerialData) {
                        console.log(value);
                    }
                }
                // console.log(JSON.parse(value))
            }
            if (done) {
                console.log('[readLoop] DONE', done);
                reader.releaseLock();
                break;
            }
        }
    }
}
