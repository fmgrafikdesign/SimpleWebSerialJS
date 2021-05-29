'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const DEFAULT_BAUDRATE = 57600;

// Simple TransformStream used to chop incoming serial data up when a new line character appears.
class LineBreakTransformer {
    constructor() {
        this.chunks = "";
    }

    transform(chunk, controller) {
        this.chunks += chunk;
        const lines = this.chunks.split("\r\n");
        this.chunks = lines.pop();
        lines.forEach((line) => controller.enqueue(line));
    }

    flush(controller) {
        controller.enqueue(this.chunks);
    }
}

function parseAsNumber(value) {
    if (typeof value == "number") {
        return value;
    } else if (typeof value == "string" && !isNaN(value) && !isNaN(parseFloat(value))) {
        return parseFloat(value);
    } else if (Array.isArray(value)) {
        let array = [];
        value.forEach(item => {
            array.push(parseAsNumber(item));
        });
        return array;
    } else if (typeof value == "object") {
        // Iterate over keys, return parsed values
        let obj = {};
        Object.keys(value).forEach(key => {
            obj[key] = parseAsNumber(value[key]);
        });
        return obj;
    } else {
        return value;
    }
}

const defaultConstructorObject = {
    baudRate: DEFAULT_BAUDRATE,
    requestButton: null,
    requestAccessOnPageLoad: true,
    accessText: "To access serial devices, user interaction is required. Please press this button to select the port you want to connect to.",
    accessButtonLabel: "Connect to Serial Port",
    styleDomElements: true,
    transformer: new LineBreakTransformer(),
    logIncomingSerialData: false,
    logOutgoingSerialData: false,
    parseStringsAsNumbers: true,
    // TODO mention this new property in documentation
    warnAboutUnregisteredEvents: true,
    newLineCharacter: '\n',
    filters: []
};

function connect(args) {
    return SimpleSerial(args)
}

const SimpleSerial = function (args) {
    if (!navigator.serial) {
        throw new Error("The Serial API not supported in your browser. Make sure you've enabled flags if necessary!");
    }

    if (typeof args === "number") {
        args = {
            ...defaultConstructorObject,
            baudRate: args
        };
    } else if (typeof args === "undefined") {
        args = defaultConstructorObject;
    } else if (typeof args === 'object') {
        // TODO check for valid configuration object (transformer, HTML Element, ...)

        // constructor object, override defaults
        args = {
            ...defaultConstructorObject,
            ...args
        };
    }

    if (args.requestButton != null) {
        args = {
            requestAccessOnPageLoad: false,
            ...args
        };
    }

    let configuration = args;

    const instance = {
        configuration,
        port: null,
        writer: null,
        modal: null,
        _listeners: {},
        _this: this,

        requestSerialAccessOnClick: function (element) {
            if (typeof element === "string") {
                // Search for HTML Element with this id
                const el = document.getElementById(element);
                if (!el) throw "Could not find element with ID '" + element + "'."
                element = el;
            }
            element.addEventListener("click", instance.connect);
        },

        createModal() {
            instance.modal = document.createElement("div");
            instance.configuration.styleDomElements ? instance.modal.setAttribute("style", "position: fixed; left: 0; top: 0; width: 100%; height: 100%; left: 0; top: 0; z-index: 10000") : null;

            const modalOverlay = document.createElement("div");
            instance.configuration.styleDomElements ? modalOverlay.setAttribute("style", "background-color: rgba(0,0,0,.3); position: absolute; left: 0; top: 0; width: 100%; height: 100%; left: 0; top: 0; cursor: pointer") : null;
            modalOverlay.classList.add("SimpleSerial-modal-overlay");

            const modalContainer = document.createElement("div");
            instance.configuration.styleDomElements ? modalContainer.setAttribute("style", "position: absolute; width: 100%; height: auto; padding: 4rem; box-sizing: border-box; ") : null;
            modalContainer.classList.add("SimpleSerial-modal-container");

            const modalInner = document.createElement("div");
            instance.configuration.styleDomElements ? modalInner.setAttribute("style", "background-color: #fff; border-radius: 4px; padding: 1rem; box-shadow: 0px 2px 11px 4px rgba(0,0,0, .09);") : null;
            modalInner.classList.add("SimpleSerial-modal-inner");

            const modalInnerText = document.createElement("p");
            instance.configuration.styleDomElements ? modalInnerText.setAttribute("style", "color: #000") : null;
            modalInnerText.innerText = instance.configuration.accessText;

            const modalInnerButton = document.createElement("button");
            modalInnerButton.innerText = instance.configuration.accessButtonLabel;
            instance.requestSerialAccessOnClick(modalInnerButton);

            modalInner.append(modalInnerText, modalInnerButton);
            modalContainer.append(modalInner);
            instance.modal.append(modalOverlay, modalContainer);

            document.body.append(instance.modal);
            return instance.modal;
        },

        removeModal() {
            instance.modal.remove();
        },

        connect: async function () {
            instance.port = await navigator.serial.requestPort({filters: instance.configuration.filters});
            await instance.port.open({
                baudRate: instance.configuration.baudRate
            });
            if (instance.configuration.requestAccessOnPageLoad) {
                instance.removeModal();
            }
            const textEncoder = new TextEncoderStream();
            textEncoder.readable.pipeTo(instance.port.writable);
            instance.writer = textEncoder.writable.getWriter();
            let decoder = new TextDecoderStream();
            instance.port.readable.pipeTo(decoder.writable);
            const reader = decoder.readable
                .pipeThrough(new TransformStream(instance.configuration.transformer))
                .getReader();
            instance.readLoop(reader).then(response => {
                console.log(response);
            }).catch(e => {
                console.error("Could not read serial data. Please make sure the same baud rate is used on device (Serial.begin()) and library. Library currently uses baud rate", instance.configuration.baudRate, "Please also make sure you're not sending too much serial data. Consider using (a higher) delay() to throttle the amount of data sent.");
                console.error(e);
            });

        },

        on(name, callback) {
            if (!instance._listeners[name]) {
                instance._listeners[name] = [];
            }
            instance._listeners[name].push(callback);
            return [name, callback];
        },

        removeListener(name, callbackToRemove) {
            if (typeof name == "object" && typeof callbackToRemove == "undefined") {
                callbackToRemove = name[1];
                name = name[0];
            }

            if (!instance._listeners[name]) {
                throw new Error('There is no listener named ' + name + '.')
            }

            let length = instance._listeners[name].length;

            instance._listeners[name] = instance._listeners[name].filter((listener) => listener !== callbackToRemove);
            return length !== instance._listeners[name].length;
        },

        // Remove all listeners of event name
        removeListeners(name) {
            if (typeof name !== "string") {
                throw new Error("removeListeners expects a string as parameter, which will be used to remove all listeners of that event.");
            }
            const length = instance._listeners[name].length;
            instance._listeners[name] = [];
            return length > 0;
        },

        ready() {
            return instance.port?.readable && instance.port?.writable
        },

        writable() {
            return instance.port?.writable
        },

        readable() {
            return instance.port?.readable
        },

        async send(name, data) {
            //if(!instance.port) throw new Error("Serial port has not been chosen yet, could not send event.");
            if(!instance.port?.writable) return;

            // If only 1 parameter is supplied, it's raw data.
            if (typeof data === "undefined") {
                if (instance.configuration.logOutgoingSerialData) {
                    console.log(name);
                }

                if (instance.configuration.parseStringsAsNumbers) {
                    name = parseAsNumber(name);
                }

                return instance.sendData(name);
            }

            // If data is an object, parse its keys as ints
            if (instance.configuration.parseStringsAsNumbers) {
                data = parseAsNumber(data);
            }

            const event = [name, data];
            const stringified = JSON.stringify(event);
            if (instance.configuration.logOutgoingSerialData) {
                console.log(stringified);
            }
            return instance.writer.write(stringified + instance.configuration.newLineCharacter);
        },

        async sendEvent(name) {
            return instance.send("_e", name);
        },

        async sendData(data) {
            return instance.send("_d", data);
        },

        emit(name, data) {
            if (instance.configuration.warnAboutUnregisteredEvents && !instance._listeners[name]) {
                return console.warn('Event ' + name + ' has been received, but it has never been registered as listener.');
            }
            instance._listeners[name].forEach(callback => callback(data));
        },

        async readLoop(reader) {

            while (true) {
                const {value, done} = await reader.read();
                if (value) {
                    let json = null;
                    try {
                        json = JSON.parse(value);
                    } catch (e) {}
                    if (json) {
                        if (instance.configuration.logIncomingSerialData) {
                            console.log(json);
                        }
                        // If it's an array, handle accordingly
                        if (typeof json == "object") {
                            if (json[0] === "_w") {
                                console.warn("[ARDUINO] " + json[1]);
                                continue;
                            }

                            if (json[0] === "_l") {
                                console.log("[ARDUINO] " + json[1]);
                                continue;
                            }

                            if (json[0] === "_e") {
                                console.error("[ARDUINO] " + json[1]);
                                continue;
                            }

                            // Reserved event name 'd': Data transfer. Register a listener "data" to listen to it.
                            if (json[0] === "_d") {
                                instance.emit('data', json[1]);
                                continue;
                            }

                            instance.emit(json[0], json[1]);
                        }

                        // If it's just a string, just call the event
                        else if (typeof json == "string") {
                            instance.emit(json, null);
                        }

                    } else {
                        if (instance.configuration.logIncomingSerialData) {
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
    };

// If a button or an id was supplied, attach an event listener to it.
    if (configuration.requestButton) {
        instance.requestSerialAccessOnClick(configuration.requestButton);
    }

// If the library should handle requesting access to the serial device, create a modal on page load.
    if (configuration.requestAccessOnPageLoad) {
        window.addEventListener("load", instance.createModal());
    }

    return instance;
};

exports.connect = connect;
//# sourceMappingURL=index.js.map
