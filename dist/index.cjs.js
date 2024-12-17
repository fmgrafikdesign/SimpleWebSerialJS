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
    setupSerialConnection: ()=>setupSerialConnection
});
const DEFAULT_BAUDRATE = 57600;
class LineBreakTransformer {
    transform(chunk, controller) {
        try {
            this.chunks += chunk;
            const lines = this.chunks.split('\r\n');
            this.chunks = lines.pop();
            lines.forEach((line)=>controller.enqueue(line));
        } catch (error) {
            console.error(`Transformation Error: ${error}`);
        }
    }
    flush(controller) {
        try {
            controller.enqueue(this.chunks);
        } catch (error) {
            console.error(`Flushing Error: ${error}`);
        }
    }
    constructor(){
        this.chunks = '';
    }
}
function parseAsNumber(value) {
    if ('number' == typeof value) return value;
    if ('string' == typeof value && !isNaN(value) && '' !== value.trim()) return parseFloat(value);
    if (Array.isArray(value)) return value.map((item)=>parseAsNumber(item));
    if ('object' == typeof value && null !== value) return Object.keys(value).reduce((acc, key)=>{
        acc[key] = parseAsNumber(value[key]);
        return acc;
    }, {});
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
function createConnectionInstance(configuration) {
    let port = null;
    let writer = null;
    let modalElement = null;
    let modalErrorElement = null;
    let _listeners = {};
    function requestSerialAccessOnClick(element) {
        if ('string' == typeof element) {
            const el = document.getElementById(element);
            if (!el) throw new Error('Could not find element with ID \'' + element + '\'.');
            element = el;
        }
        element.addEventListener('click', startConnection);
    }
    function createModal() {
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
        if (configuration.styleDomElements) {
            modal.setAttribute('style', 'position: fixed; left: 0; top: 0; width: 100%; height: 100%; left: 0; top: 0; z-index: 10000');
            modalOverlay.setAttribute('style', 'background-color: rgba(0,0,0,.3); position: absolute; left: 0; top: 0; width: 100%; height: 100%; left: 0; top: 0; cursor: pointer');
            modalContainer.setAttribute('style', 'position: absolute; width: 100%; height: auto; padding: 4rem; box-sizing: border-box;');
            modalInner.setAttribute('style', 'background-color: #fff; border-radius: 4px; padding: 1rem; box-shadow: 0px 2px 11px 4px rgba(0,0,0, .09);');
            modalInnerText.setAttribute('style', 'color: #000');
            modalErrorText.setAttribute('style', 'color: #dd0000');
        }
        modalInnerText.innerText = configuration.accessText;
        modalInnerButton.innerText = configuration.accessButtonLabel;
        requestSerialAccessOnClick(modalInnerButton);
        modalInner.append(modalInnerText, modalErrorText, modalInnerButton);
        modalContainer.append(modalInner);
        modal.append(modalOverlay, modalContainer);
        modalElement = modal;
        modalErrorElement = modalErrorText;
        document.body.append(modal);
        return modal;
    }
    function showErrorMessageInModal(message) {
        if (!modalErrorElement) return;
        modalErrorElement.innerHTML = message;
    }
    function removeModal() {
        null == modalElement || modalElement.remove();
    }
    async function startConnection() {
        if (ready()) throw new Error('Serial connection has already been established.');
        try {
            port = await navigator.serial.requestPort({
                filters: configuration.filters
            });
            await port.open({
                baudRate: configuration.baudRate
            });
        } catch (e) {
            showErrorMessageInModal("There was an error trying to open a serial connection. Please make sure the port is not occupied in another tab or process. Error message:<br>" + e);
            throw new Error(e);
        }
        if (configuration.requestAccessOnPageLoad) removeModal();
        const textEncoder = new TextEncoderStream();
        writer = textEncoder.writable.getWriter();
        const decoder = new TextDecoderStream();
        textEncoder.readable.pipeTo(port.writable);
        port.readable.pipeTo(decoder.writable);
        const inputStream = decoder.readable;
        const reader = inputStream.pipeThrough(new TransformStream(configuration.transformer)).getReader();
        readLoop(reader).then((response)=>{
            console.log(response, 'readLoop done');
        }).catch((e)=>{
            console.error('Could not read serial data. Please make sure the same baud rate is used on device (Serial.begin()) and library. Library currently uses baud rate', configuration.baudRate, 'Please also make sure you\'re not sending too much serial data. Consider using (a higher) delay() to throttle the amount of data sent.');
            console.error(e);
        });
    }
    function on(name, callback) {
        if (!_listeners[name]) _listeners[name] = [];
        _listeners[name].push(callback);
        return [
            name,
            callback
        ];
    }
    function removeListener(name, callbackToRemove) {
        if ('object' == typeof name && void 0 === callbackToRemove) {
            callbackToRemove = name[1];
            name = name[0];
        }
        if (!_listeners[name]) throw new Error('There is no listener named ' + name + '.');
        const length = _listeners[name].length;
        _listeners[name] = _listeners[name].filter((listener)=>listener !== callbackToRemove);
        return length !== _listeners[name].length;
    }
    function removeListeners(name) {
        if ('string' != typeof name) throw new Error('removeListeners expects a string as parameter, which will be used to remove all listeners of that event.');
        const length = _listeners[name].length;
        _listeners[name] = [];
        return length > 0;
    }
    function ready() {
        return (null == port ? void 0 : port.readable) && (null == port ? void 0 : port.writable);
    }
    function writable() {
        return null == port ? void 0 : port.writable;
    }
    function readable() {
        return null == port ? void 0 : port.readable;
    }
    async function send(name, data) {
        if (!(null == port ? void 0 : port.writable)) return;
        if (void 0 === data) {
            if (configuration.logOutgoingSerialData) console.log(name);
            if (configuration.parseStringsAsNumbers) name = parseAsNumber(name);
            return sendData(name);
        }
        if (configuration.parseStringsAsNumbers) data = parseAsNumber(data);
        const event = [
            name,
            data
        ];
        const stringified = JSON.stringify(event);
        if (configuration.logOutgoingSerialData) console.log(stringified);
        return writer.write(stringified + configuration.newLineCharacter);
    }
    async function sendEvent(name) {
        return send('_e', name);
    }
    async function sendData(data) {
        return send('_d', data);
    }
    function emit(name, data) {
        if (_listeners[name]) _listeners[name].forEach((callback)=>callback(data));
        else if (configuration.warnAboutUnregisteredEvents) return console.warn('Event ' + name + ' has been received, but it has never been registered as listener.');
    }
    async function readLoop(reader) {
        while(true){
            const { value, done } = await reader.read();
            if (value) {
                let json = null;
                try {
                    json = JSON.parse(value);
                } catch  {}
                if (json) {
                    if (configuration.logIncomingSerialData) console.log(json);
                    if ('object' == typeof json) {
                        if ('_w' === json[0]) {
                            console.warn('[ARDUINO] ' + json[1]);
                            continue;
                        }
                        if ('_l' === json[0]) {
                            console.log('[ARDUINO] ' + json[1]);
                            continue;
                        }
                        if ('_e' === json[0]) {
                            console.error('[ARDUINO] ' + json[1]);
                            continue;
                        }
                        if ('_d' === json[0]) {
                            emit('data', json[1]);
                            continue;
                        }
                        emit(json[0], json[1]);
                    } else if ('string' == typeof json) emit(json, null);
                } else if (configuration.logIncomingSerialData) console.log(value);
            }
            if (done) {
                console.log('[readLoop] DONE', done);
                reader.releaseLock();
                break;
            }
        }
    }
    function getPort() {
        return port;
    }
    function getWriter() {
        return writer;
    }
    function setWriter(newWriter) {
        writer = newWriter;
        return writer;
    }
    return {
        configuration,
        createModal,
        emit,
        modalElement,
        on,
        getPort,
        ready,
        readable,
        removeListener,
        removeListeners,
        requestSerialAccessOnClick,
        send,
        sendData,
        sendEvent,
        startConnection,
        writable,
        writer,
        getWriter,
        setWriter
    };
}
const setupSerialConnection = function(args) {
    if (!navigator.serial) throw new Error('The Serial API not supported in your browser. Make sure you\'ve enabled flags if necessary!');
    if ('number' == typeof args) args = {
        ...createDefaultConstructorObject(),
        baudRate: args
    };
    else if (void 0 === args) args = createDefaultConstructorObject();
    else if ('object' == typeof args) args = {
        ...createDefaultConstructorObject(),
        ...args
    };
    if (null != args.requestElement) args = {
        ...args,
        requestAccessOnPageLoad: false
    };
    const configuration = args;
    const instance = createConnectionInstance(configuration);
    if (configuration.requestElement) instance.requestSerialAccessOnClick(configuration.requestElement);
    if (configuration.requestAccessOnPageLoad) window.addEventListener('load', instance.createModal);
    return instance;
};
var __webpack_export_target__ = exports;
for(var __webpack_i__ in __webpack_exports__)__webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if (__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, '__esModule', {
    value: true
});
