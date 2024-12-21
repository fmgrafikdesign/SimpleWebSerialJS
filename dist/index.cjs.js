"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.d = function(exports1, definition) {
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key)) Object.defineProperty(exports1, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = function(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    };
})();
(()=>{
    __webpack_require__.r = function(exports1) {
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports1, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports1, '__esModule', {
            value: true
        });
    };
})();
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
    LineBreakTransformer: ()=>LineBreakTransformer,
    setupSerialConnection: ()=>setupSerialConnection,
    DEFAULT_BAUDRATE: ()=>DEFAULT_BAUDRATE
});
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
const DEFAULT_BAUDRATE = 57600;
class LineBreakTransformer {
    transform(chunk, controller) {
        try {
            this.chunks += chunk;
            const lines = this.chunks.split(this.delimiter);
            this.chunks = lines.pop() || '';
            for (const line of lines)controller.enqueue(line);
        } catch (error) {
            console.error(`Transformation Error: ${error} @chunk: ${chunk}`);
        }
    }
    flush(controller) {
        try {
            if (this.chunks) controller.enqueue(this.chunks);
        } catch (error) {
            console.error(`Flushing Error: ${error}`);
        }
    }
    constructor(delimiter = '\r\n'){
        _define_property(this, "chunks", void 0);
        _define_property(this, "delimiter", void 0);
        this.chunks = '';
        this.delimiter = delimiter;
    }
}
function parseNumbersRecursively(value) {
    if ('number' == typeof value) return value;
    if ('string' == typeof value && !Number.isNaN(+value) && '' !== value.trim()) return parseFloat(value);
    if (Array.isArray(value)) return value.map((item)=>parseNumbersRecursively(item));
    if ('object' == typeof value && null !== value) {
        const result = {};
        for(const key in value)result[key] = parseNumbersRecursively(value[key]);
        return result;
    }
    return value;
}
function createDefaultConstructorObject() {
    return {
        baudRate: DEFAULT_BAUDRATE,
        requestElement: null,
        requestAccessOnPageLoad: false,
        accessText: 'To access serial devices, user interaction is required. Please press this button to select the serial device you want to connect to.',
        accessButtonLabel: 'Choose device / port',
        styleDomElements: true,
        transformer: new LineBreakTransformer(),
        logIncomingSerialData: false,
        logOutgoingSerialData: false,
        parseStringsAsNumbers: true,
        warnAboutUnregisteredEvents: true,
        newLineCharacter: '\n',
        filters: []
    };
}
class SerialConnection {
    requestSerialAccessOnClick(element) {
        if ('string' == typeof element) {
            const el = document.getElementById(element);
            if (!el) throw new Error(`Could not find element with ID '${element}'.`);
            element = el;
        }
        element.addEventListener('click', this.startConnection);
    }
    createModal() {
        const [modal, modalOverlay, modalContainer, modalInner, modalInnerText, modalErrorText, modalInnerButton] = [
            'div',
            'div',
            'div',
            'div',
            'p',
            'p',
            'button'
        ].map((tag)=>document.createElement(tag));
        modalContainer.classList.add('SimpleWebSerial-modal-container');
        modalOverlay.classList.add('SimpleWebSerial-modal-overlay');
        modalInner.classList.add('SimpleWebSerial-modal-inner');
        if (this.configuration.styleDomElements) {
            modal.setAttribute('style', 'position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 10000');
            modalOverlay.setAttribute('style', 'background-color: rgba(0,0,0,.3); position: absolute; left: 0; top: 0; width: 100%; height: 100%; cursor: pointer');
            modalContainer.setAttribute('style', 'position: absolute; width: 100%; height: auto; padding: 4rem; box-sizing: border-box;');
            modalInner.setAttribute('style', 'background-color: #fff; border-radius: 4px; padding: 1rem; box-shadow: 0px 2px 11px 4px rgba(0,0,0, .09);');
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
    showErrorMessageInModal(message) {
        if (!this._modalErrorElement) return;
        this._modalErrorElement.innerHTML = message;
    }
    removeModal() {
        var _this__modalElement;
        null === (_this__modalElement = this._modalElement) || void 0 === _this__modalElement || _this__modalElement.remove();
    }
    async startConnection() {
        if (this.ready()) throw new Error('Serial connection has already been established.');
        try {
            this.port = await navigator.serial.requestPort({
                filters: this.configuration.filters
            });
            await this.port.open({
                baudRate: this.configuration.baudRate
            });
        } catch (e) {
            this.showErrorMessageInModal("There was an error trying to open a serial connection. Please make sure the port is not occupied in another tab or process. Error message:<br>" + e);
            throw e;
        }
        if (this.configuration.requestAccessOnPageLoad) this.removeModal();
        const textEncoder = new TextEncoderStream();
        this.writer = textEncoder.writable.getWriter();
        const decoder = new TextDecoderStream();
        textEncoder.readable.pipeTo(this.port.writable);
        this.port.readable.pipeTo(decoder.writable);
        const inputStream = decoder.readable;
        const reader = inputStream.pipeThrough(new TransformStream(this.configuration.transformer)).getReader();
        this.readLoop(reader).catch((e)=>{
            console.error('Could not read serial data. Please make sure the same baud rate is used on device (Serial.begin()) and library. Library currently uses baud rate', this.configuration.baudRate, "Please also make sure you're not sending too much serial data. Consider using (a higher) delay() to throttle the amount of data sent.");
            console.error(e);
        });
    }
    on(name, callback) {
        if (!this._listeners[name]) this._listeners[name] = [];
        this._listeners[name].push(callback);
        return [
            name,
            callback
        ];
    }
    removeListener(nameOrListener, callbackToRemove) {
        let name;
        if (Array.isArray(nameOrListener) && void 0 === callbackToRemove) [name, callbackToRemove] = nameOrListener;
        else if ('string' == typeof nameOrListener && void 0 !== callbackToRemove) name = nameOrListener;
        else throw new Error('Invalid arguments for removeListener.');
        if (!this._listeners[name]) throw new Error('There is no listener named ' + name + '.');
        const length = this._listeners[name].length;
        this._listeners[name] = this._listeners[name].filter((listener)=>listener !== callbackToRemove);
        return length !== this._listeners[name].length;
    }
    removeListeners(name) {
        var _this__listeners_name;
        if ('string' != typeof name) throw new Error('removeListeners expects a string as parameter, which will be used to remove all listeners of that event.');
        const length = (null === (_this__listeners_name = this._listeners[name]) || void 0 === _this__listeners_name ? void 0 : _this__listeners_name.length) || 0;
        this._listeners[name] = [];
        return length > 0;
    }
    ready() {
        var _this_port, _this_port1;
        return !!((null === (_this_port = this.port) || void 0 === _this_port ? void 0 : _this_port.readable) && (null === (_this_port1 = this.port) || void 0 === _this_port1 ? void 0 : _this_port1.writable));
    }
    readable() {
        var _this_port;
        return (null === (_this_port = this.port) || void 0 === _this_port ? void 0 : _this_port.readable) || null;
    }
    writable() {
        var _this_port;
        return (null === (_this_port = this.port) || void 0 === _this_port ? void 0 : _this_port.writable) || null;
    }
    async send(name, data) {
        var _this_port;
        if (!(null === (_this_port = this.port) || void 0 === _this_port ? void 0 : _this_port.writable) || !this.writer) return;
        let messageToSend;
        if (void 0 === data) {
            if (this.configuration.logOutgoingSerialData) console.log(name);
            if (this.configuration.parseStringsAsNumbers) name = parseNumbersRecursively(name);
            messageToSend = [
                '_d',
                name
            ];
        } else {
            if (this.configuration.parseStringsAsNumbers) data = parseNumbersRecursively(data);
            messageToSend = [
                name,
                data
            ];
        }
        const stringified = JSON.stringify(messageToSend);
        if (this.configuration.logOutgoingSerialData) console.log(stringified);
        await this.writer.write(stringified + this.configuration.newLineCharacter);
    }
    async sendEvent(name) {
        await this.send('_e', name);
    }
    async sendData(data) {
        await this.send('_d', data);
    }
    emit(name, data) {
        if (this._listeners[name]) this._listeners[name].forEach((callback)=>callback(data));
        else if (this.configuration.warnAboutUnregisteredEvents) console.warn('Event ' + name + ' has been received, but it has never been registered as listener.');
    }
    async readLoop(reader) {
        while(true){
            const { value, done } = await reader.read();
            if (value) {
                let json = null;
                try {
                    json = JSON.parse(value);
                } catch (error) {
                    if (this.configuration.logIncomingSerialData) console.warn('Failed to parse serial data:', value, '| Reported error:', error);
                }
                if (json) {
                    if (this.configuration.logIncomingSerialData) console.log(json);
                    if (Array.isArray(json)) switch(json[0]){
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
                            this.emit(json[0], json[1]);
                            continue;
                    }
                    else if ('string' == typeof json) this.emit(json, null);
                } else if (this.configuration.logIncomingSerialData) console.log(value);
            }
            if (done) {
                console.log('[readLoop] DONE', done);
                reader.releaseLock();
                break;
            }
        }
    }
    getPort() {
        return this.port;
    }
    getWriter() {
        return this.writer;
    }
    setWriter(newWriter) {
        this.writer = newWriter;
        return this.writer;
    }
    get modalElement() {
        return this._modalElement;
    }
    constructor(configuration){
        _define_property(this, "port", null);
        _define_property(this, "writer", null);
        _define_property(this, "_modalElement", null);
        _define_property(this, "_modalErrorElement", null);
        _define_property(this, "_listeners", {});
        _define_property(this, "configuration", void 0);
        this.configuration = configuration;
        this.startConnection = this.startConnection.bind(this);
        this.createModal = this.createModal.bind(this);
    }
}
function setupSerialConnection(args) {
    if (!navigator.serial) throw new Error("The Serial API is not supported in your browser. Make sure you've enabled flags if necessary!");
    let configuration;
    if ('number' == typeof args) configuration = {
        ...createDefaultConstructorObject(),
        baudRate: args
    };
    else if (void 0 === args) configuration = createDefaultConstructorObject();
    else if ('object' == typeof args) configuration = {
        ...createDefaultConstructorObject(),
        ...args
    };
    else throw new Error('Invalid arguments for setupSerialConnection.');
    if (null != configuration.requestElement) configuration = {
        ...configuration,
        requestAccessOnPageLoad: false
    };
    const instance = new SerialConnection(configuration);
    if (configuration.requestElement) instance.requestSerialAccessOnClick(configuration.requestElement);
    if (configuration.requestAccessOnPageLoad) window.addEventListener('load', instance.createModal);
    return instance;
}
var __webpack_export_target__ = exports;
for(var __webpack_i__ in __webpack_exports__)__webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if (__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, '__esModule', {
    value: true
});
