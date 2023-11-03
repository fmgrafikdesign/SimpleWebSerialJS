const DEFAULT_BAUDRATE = 57600;

// Simple TransformStream used to chop incoming serial data up when a new line character appears.
class LineBreakTransformer {
    constructor() {
        this.chunks = '';
    }

    transform(chunk, controller) {
        try {
            this.chunks += chunk;
            const lines = this.chunks.split('\r\n');
            this.chunks = lines.pop();
            lines.forEach(line => controller.enqueue(line));
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
}

function parseAsNumber(value) {
    if (typeof value === 'number') return value
    if (typeof value === 'string' && !isNaN(value)) return parseFloat(value)
    if (Array.isArray(value)) return value.map(item => parseAsNumber(item))
    if (typeof value === 'object') return Object.keys(value).reduce((acc, key) => ({
        ...acc,
        [key]: parseAsNumber(value[key])
    }), {})
    return value
}

const DEFAULT_CONSTRUCTOR_OBJECT = {
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

function createConnectionInstance(configuration) {
    let port = null;
    let writer = null;
    let modalElement = null;
    let modalErrorElement = null;
    let _listeners = {};

    function requestSerialAccessOnClick(element) {
        if (typeof element === 'string') {
            // Search for HTML Element with this id
            const el = document.getElementById(element);
            if (!el) throw new Error('Could not find element with ID \'' + element + '\'.')
            element = el;
        }
        element.addEventListener('click', startConnection);
    }

    function createModal() {
        const [
            modal,
            modalOverlay,
            modalContainer,
            modalInner,
            modalInnerText,
            modalErrorText,
            modalInnerButton
        ] = ['div', 'div', 'div', 'div', 'p', 'p', 'button'].map(tag => document.createElement(tag));
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
        return modal
    }

    function showErrorMessageInModal(message) {
        if (!modalErrorElement) return
        modalErrorElement.innerHTML = message;
    }

    function removeModal() {
        modalElement?.remove();
    }

    async function startConnection() {
        if (ready()) throw new Error('Serial connection has already been established.');

        try {
            port = await navigator.serial.requestPort({ filters: configuration.filters });
            await port.open({
                baudRate: configuration.baudRate
            });
        } catch (e) {
            showErrorMessageInModal('There was an error trying to open a serial connection. ' +
                'Please make sure the port is not occupied in another tab or process. Error message:<br>' + e);
            throw new Error(e)
        }
        if (configuration.requestAccessOnPageLoad) {
            removeModal();
        }
        const textEncoder = new TextEncoderStream();
        writer = textEncoder.writable.getWriter();
        const decoder = new TextDecoderStream();
        // TODO create methods to close the connection and release the port using these
        /* eslint-disable no-unused-vars */
        textEncoder.readable.pipeTo(port.writable);
        port.readable.pipeTo(decoder.writable);
        /* eslint-enable no-unused-vars */
        const inputStream = decoder.readable;
        const reader = inputStream
            .pipeThrough(new TransformStream(configuration.transformer))
            .getReader();
        readLoop(reader).then(response => {
            console.log(response, 'readLoop done');
        }).catch(e => {
            console.error('Could not read serial data. Please make sure the same baud rate is used on device (Serial.begin()) and library. Library currently uses baud rate', configuration.baudRate, 'Please also make sure you\'re not sending too much serial data. Consider using (a higher) delay() to throttle the amount of data sent.');
            console.error(e);
        });
    }

    function on(name, callback) {
        if (!_listeners[name]) {
            _listeners[name] = [];
        }
        _listeners[name].push(callback);
        return [name, callback]
    }

    function removeListener(name, callbackToRemove) {
        if (typeof name === 'object' && typeof callbackToRemove === 'undefined') {
            callbackToRemove = name[1];
            name = name[0];
        }

        if (!_listeners[name]) {
            throw new Error('There is no listener named ' + name + '.')
        }

        const length = _listeners[name].length;

        _listeners[name] = _listeners[name].filter((listener) => listener !== callbackToRemove);
        return length !== _listeners[name].length
    }

    // Remove all listeners of event name
    function removeListeners(name) {
        if (typeof name !== 'string') {
            throw new Error('removeListeners expects a string as parameter, which will be used to remove all listeners of that event.')
        }
        const length = _listeners[name].length;
        _listeners[name] = [];
        return length > 0
    }

    function ready() {
        return port?.readable && port?.writable
    }

    function writable() {
        return port?.writable
    }

    function readable() {
        return port?.readable
    }

    async function send(name, data) {
        if (!port?.writable) return

        // If only 1 parameter is supplied, it's raw data.
        if (typeof data === 'undefined') {
            if (configuration.logOutgoingSerialData) {
                console.log(name);
            }

            if (configuration.parseStringsAsNumbers) {
                name = parseAsNumber(name);
            }

            return sendData(name)
        }

        // If data is an object, parse its keys as ints
        if (configuration.parseStringsAsNumbers) {
            data = parseAsNumber(data);
        }

        const event = [name, data];
        const stringified = JSON.stringify(event);
        if (configuration.logOutgoingSerialData) {
            console.log(stringified);
        }
        return writer.write(stringified + configuration.newLineCharacter)
    }

    async function sendEvent(name) {
        return send('_e', name)
    }

    async function sendData(data) {
        return send('_d', data)
    }

    function emit(name, data) {
        if (configuration.warnAboutUnregisteredEvents && !_listeners[name]) {
            return console.warn('Event ' + name + ' has been received, but it has never been registered as listener.')
        }
        _listeners[name].forEach(callback => callback(data));
    }

    async function readLoop(reader) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const {value, done} = await reader.read();
            if (value) {
                let json = null;
                try {
                    json = JSON.parse(value);
                } catch {
                    // Ignore bad reads
                }
                if (json) {
                    if (configuration.logIncomingSerialData) {
                        console.log(json);
                    }
                    // If it's an array, handle accordingly
                    if (typeof json === 'object') {
                        if (json[0] === '_w') {
                            console.warn('[ARDUINO] ' + json[1]);
                            continue
                        }

                        if (json[0] === '_l') {
                            console.log('[ARDUINO] ' + json[1]);
                            continue
                        }

                        if (json[0] === '_e') {
                            console.error('[ARDUINO] ' + json[1]);
                            continue
                        }

                        // Reserved event name 'd': Data transfer. Register a listener "data" to listen to it.
                        if (json[0] === '_d') {
                            emit('data', json[1]);
                            continue
                        }

                        emit(json[0], json[1]);
                    }

                    // If it's just a string, just call the event
                    else if (typeof json === 'string') {
                        emit(json, null);
                    }
                } else {
                    if (configuration.logIncomingSerialData) {
                        console.log(value);
                    }
                }
            }
            if (done) {
                console.log('[readLoop] DONE', done);
                reader.releaseLock();
                break
            }
        }
    }

    return {
        createModal,
        emit,
        modalElement,
        on,
        port,
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
    }
}

const setupSerialConnection = function (args) {
    if (!navigator.serial) {
        throw new Error('The Serial API not supported in your browser. Make sure you\'ve enabled flags if necessary!')
    }

    if (typeof args === 'number') {
        args = {
            ...DEFAULT_CONSTRUCTOR_OBJECT,
            baudRate: args
        };
    } else if (typeof args === 'undefined') {
        args = DEFAULT_CONSTRUCTOR_OBJECT;
    } else if (typeof args === 'object') {

        // constructor object, override defaults
        args = {
            ...DEFAULT_CONSTRUCTOR_OBJECT,
            ...args
        };
    }

    if (args.requestElement != null) {
        args = {
            ...args,
            requestAccessOnPageLoad: false,
        };
    }

    const configuration = args;

    const instance = createConnectionInstance(configuration);

    // If a button or an id was supplied, attach an event listener to it.
    if (configuration.requestElement) {
        instance.requestSerialAccessOnClick(configuration.requestElement);
    }

    // If the library should handle requesting access to the serial device, create a modal on page load.
    if (configuration.requestAccessOnPageLoad) {
        window.addEventListener('load', instance.createModal);
    }

    return instance
};

export { setupSerialConnection };
//# sourceMappingURL=index.js.map
