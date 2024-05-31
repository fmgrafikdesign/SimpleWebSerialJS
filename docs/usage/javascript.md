# JavaScript Usage

## Basics

To use the library, store an instance of it in a variable by calling its connect method.

If you've included the library via \<script> tag:

```javascript
const connection = SimpleWebSerial.setupSerialConnection({
    requestAccessOnPageLoad: true
});
```

If you've installed the library using a bundler like webpack or vite:

```javascript
import { setupSerialConnection } from 'simple-web-serial';

const connection = setupSerialConnection({
    requestAccessOnPageLoad: true
});
```

{% hint style="info" %}
When setting the `requestAccessOnPageLoad` parameter to `true`, a modal is shown with a prompt to select a serial device. This is ideal for quick prototyping. If you want to have better control over when to establish the connection, the parameter can be left out.&#x20;
{% endhint %}

### Listening to events

Define events you want to listen to with the `on` method. `on`takes an event name as its first parameter and a callback as its second:

```javascript
connection.on('event-from-arduino', function(data) {
    console.log('Received event "event-from-arduino" with parameter ' + data)
});
```

### Sending events

You can also send events to the Arduino, any valid JSON can be sent as parameter. This includes numbers, strings, arrays and objects:

```javascript
connection.send('event-with-string', "Hello there, Arduino");

connection.send('event-with-number', 123);

connection.send('event-with-array', [42, "Nice string"];

connection.send('event-with-object', { r: 255, g: 255, b: 255 });
```

That's the basics! There are a few more concepts, like waiting for the serial write to finish, customising the set-up routine and removing listeners, but this is enough to build your first applications.

## Methods

### `setupSerialConnection` (undefined | number baudRate | object constructorObject)

When creating a SimpleWebSerial instance, it has a default set-up that works out of the box. However, you can adjust this to your needs.

**Example:**

```javascript
const conn  = SimpleWebSerial.connect(); // Default, out-of-the-box behavior
const conn2 = SimpleWebSerial.connect(9600); // Connect with a lower connection speed
const conn3 = SimpleWebSerial.connect({ // Connection with a custom constructor object
    baudRate: 9600,
    requestAccessOnPageLoad: true,
});
```

**`constructorObject`**

The constructor object can be used to customize the behavior of the connection, i.e. whether the library should ask for permission to use the serial port on page load, or if incoming serial data should be logged. A list of possible properties can be found below.

**`baudRate: number`** _(Default: 57600)_\
The baud rate (think: connection speed) used for the library. If you change this, make sure to also change it in your Arduino code! If you set it too high, the internal Arduino buffer might overflow.

**`requestAccessOnPageLoad: bool`** _(Default: false)_\
Defines whether the library should display a modal on page load, asking for permission to use the Web Serial API. If you want to handle authorization yourself, or at a later point in your app, set this to false.

**`requestElement: string | HTMLElement`** _(Default: null)_\
Defines an element to use for authorization. Can be an id, e.g. "authorization-button", or an HTMLElement. An event listener will be attached to the element, and when the user clicks the element, the "Chose the serial port you want to use" dialogue will appear. The element must exist when creating the connection. Automatically sets requestAccessOnPageLoad to false. If the element does not exist when creating the connection, you may opt for the startConnection method instead.

**`accessText: string`** _(Default: "To access serial devices, user interaction is required. Please press this button to select the serial device you want to connect to.")_\
Lets you customise the message that appears in the modal on page load if requestAccessOnPageLoad is set to true.

**`accessButtonLabel: string`** _(Default: "Connect to Serial Port.")_\
Let's you customise the label of the button that appears in the modal on page load if requestAccessOnPageLoad is set to true.

**`styleDomElements: bool`** _(Default: true)_\
Whether the library should apply basic styling to the modal so it does in fact look like a modal. If you want to style the modal yourself, set this to false.

**`transformer: TransformStream`** _(Default: new LineBreakTransformer())_\
What kind of transformer should be used to transform incoming serial data. Per default this is a integrated linebreak transformer, which adds serial data into a buffer until a linebreak character occurs, at which point the buffer gets sent to the library for event handling. If you want to write your own transformer, check out the [TransformStream interface](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream).

**`logIncomingSerialData: bool`** _(Default: false)_\
If set to true, will use console.log() to log all incoming serial data from the Arduino. Useful for debugging.

**`logOutgoingSerialData: bool`** _(Default: false)_\
If set to true, will use console.log() to log all outgoing serial data from the browser. Useful for debugging.

**`warnAboutUnregisteredEvents: bool`** _(Default: true)_\
If set to true, the browser will tell you if events are being sent that have no registered listener.

**`newLineCharacter: string`** _(Default: '\n')_\
_The character to use as a delimiter in the new line transformer._

**`parseStringsAsNumber: bool`** _(Default: true)_\
If set to true, will try to parse strings as numbers to avoid type errors. Example: Values from inputs like sliders or text inputs are strings. This setting will convert them into numbers so they can be used by the Arduino as such.

**`filters: array`** _(Default: \[])_\
The filters property allows you to filter available serial devices that are shown when requesting access to them. This can be used to write web applications for specific devices and prevent the user from connecting them to another device, preventing confusion. Details can be found [here](https://wicg.github.io/serial/#dom-serial-requestport).

## Instance Methods

These are methods that can be invoked on an instance of the library (= a connection) that has been initialized by calling `setupSerialConnection`.

### `.on(string eventName, function callback)`

Define an event to listen to, and the callback to execute when the event gets sent by the Arduino. The callback accepts one parameter (optional), which can be any valid json (numbers, strings, arrays, objects).  Multiple listeners for a single event name are supported. Example:

```javascript
connection.on("log", function() {
    console.log("I received a log event!");
}

connection.on("log", function(data) {
    console.log(data);
})
```

#### `.on("data", function callback)`

When sending pure data from an Arduino via `.sendData`, listen to it by listening to the `"data"` event. Example:

{% tabs %}
{% tab title="Arduino" %}
```c
WebSerial.sendData(12345);
```
{% endtab %}

{% tab title="JavaScript" %}
```javascript
conn.on("data", function(data) {
    console.log(data)
})
```
{% endtab %}
{% endtabs %}

{% hint style="info" %}
Sending pure data is a good option if you need to send high amounts of data quickly, as it shaves off a few bytes per message, resulting in higher throughput.&#x20;
{% endhint %}

### `.send(eventName, JSON parameter);`

Send an event to the Arduino. First parameter is the event name, second any valid json that is sent to the callback function of the event on the Arduino. Example:

```javascript
connection.send("led", true); // Send event "led" with payload true
connection.send("requestAverage", { pin: 0, measureDuration: 2000 });
```

### `.sendEvent(string eventName);`

If you just want to send an event without any payload, you can use this helper function. Example:

```javascript
connection.sendEvent("requestData"); // Send event "requestData" without any payload
```

### `.sendData(JSON data)`;

If you want to send pure data, you can use this. This will omit the event name and can be listened to on the Arduino via `.on("data", callback)`. This allows for higher throughput. Example:

```javascript
connection.sendData(12345);
```

### `.removeListener([string eventName, function callback])`

Removes a previously defined event listener. It will no longer listen to incoming data. The `on` method returns an array containing the event name and callback function, which means you can save a listener in a variable and call `removeListener` with it. Example:

```javascript
const connection = setupSerialConnection({ requestAccessOnPageLoad: true });

const listener = conn.on("eventname", function() { /* do something */ });

conn.removeListener(listener); // the event "eventname" is no longer listened to
```

### `.removeListeners(string eventName)`

Removes all listeners of a single event name. Example:

```javascript
const connection = setupSerialConnection({ requestAccessOnPageLoad: true });

const listener1 = conn.on("eventname", function() { /* do something */ });
const listener2 = conn.on("eventname", function(data) { /* do something else */ });

conn.removeListeners("eventname"); // the event "eventname" is no longer listened to
```

### `.requestSerialAccessOnClick(elementId | HTMLElement element)`

If you use a framework like Vue or similar, and you want to handle requesting access to the serial port yourself, you might run into the problem that the element you want to use for user interaction (e.g. a button) does not exist on page load or when the library gets initialized. To get around this problem, you can use this method to programmatically attach a click listener to an element, which will then handle the authorization request for you. Example:

<pre class="language-javascript"><code class="lang-javascript">const element = document.createElement("button");
element.innerText = "click me for serial access prompt";
<strong>document.body.append(element);
</strong>
const connection = setupSerialConnection();
connection.requestSerialAccessOnClick(element);

// The element now listens for clicks and will
// display the authorization modal on click
</code></pre>

### `.startConnection()`

Calling startConnection prompts the selection of the serial device and establishes a connection with it. This is the best method if you want control over when and how the user is prompted for the device. Be aware that serial connections are only possible as a response to a user gesture. Example:

<pre class="language-javascript"><code class="lang-javascript">const element = document.createElement("button");
element.innerText = "click me for serial access prompt";
<strong>document.body.append(element);
</strong>
const connection = setupSerialConnection();
element.addEventListener('click', function() {
    connection.startConnection(); // WORKS as it is in response to user interaction
}

window.addEventListener('load', function() {
    connection.startConnection(); // WON'T WORK because it's not in response to a user interaction
});
</code></pre>

## Advanced

### Asynchronous function calls

Writing to the serial port is not synchronous, but _asynchronous_. This means, your code will continue running while trying to write data to the serial port in the background.

```javascript
function sendEvent()  {
    connection.send('someEvent', "arbitrary data");
    console.log("I might be called before the event has been written");
}
```

To prevent this, you can make use `async` /`await` . This will make the execution of your code stop until the event has been successfully written. Mark your function as `async` and tell it to `await` the completion of the event before continuing:

```javascript
async function sendEvent() {
    await connection.send('someEvent', "arbitrary data");
    console.log("I definitely won't be called until the event has been written");
}
```

That's it! For more information on async / await, why it's very handy, or what to use as an alternative, you can refer to [this tutorial](https://javascript.info/async-await).
