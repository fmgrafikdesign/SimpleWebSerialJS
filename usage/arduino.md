# Arduino Usage

## Basics

{% hint style="info" %}
Basic knowledge of Arduino programming is assumed.
{% endhint %}

Please make sure you've completed the [set-up for Arduino](../installation/arduino.md).

In your set-up routine, you initialize serial communication. Remember to include the library:

```c
#include <SimpleWebSerial.h>
SimpleWebSerial WebSerial;

void setup() {
    // 57600 is the default connection speed used in the JavaScript library.
    Serial.begin(57600);
}
```

### Listening to events

Define events you want to listen to in your code with the `on` method. `on`takes an event name as its first parameter and a callback function as its second. The callback function receives the payload of the event as its parameter.

To make sure the library knows when there is new serial data available, call the `check()` method at the beginning of each `loop()` . Your code might look like this:

```c
#include <SimpleWebSerial.h>;
SimpleWebSerial WebSerial;

void setup() {
    Serial.begin(57600);
    
    // Defining an event listener with event name and callback function.
    WebSerial.on("browser-event", doSomething);
}

// This is our callback function.
// JSONVar is the type of the parameter and has to be explicitly specified.
void doSomething(JSONVar parameter) {
    // Do something with parameter
}

void loop() {
    // WebSerial needs to check if there is serial data
    WebSerial.check();
}
```

You can receive any valid JSON as a parameter in your callback function. Make sure to always explicitly type the parameter of your callback function as `JSONVar`:

```c
void callbackWithBool(JSONVar some_bool) {
    digitalWrite(0, some_bool);
}

void callbackWithNumberParameter(JSONVar some_number) {
    analogWrite(0, some_number);
}

void callbackWithStringParameter(JSONVar some_string) {
    JSONVar copy_string = some_string;
}

void callbackWithArray(JSONVar some_array) {
    digitalWrite(0, some_array[0]);
    analogWrite(1, some_array[1]);
}

void callbackWithObject(JSONVar some_object) {
    digitalWrite(0, some_object["first_key"];
    analogWrite(1, some_object["second_key"];
}
```

If you are a fan of arrow- / lambda-functions, you can use a similar construct on your Arduino:

```c
// An event listener, but with a lambda-function as callback, for brevity:
WebSerial.on("browser-event", [](JSONVar data) {
    // Do something
});
```

### Sending events to the browser

You can send arbitrarily named events to the browser, together with any valid JSON as parameter. This includes numbers, strings, arrays and objects:

#### Numbers and strings

```bash
WebSerial.send("event-with-string", "Hello there, browser");

WebSerial.send("event-with-number", 123);
```

#### Sending Arrays and JSON

To send arrays or JSON objects, use the following syntax:

```c
// Arrays
JSONVar myArray;
myArray[0] = 42;
myArray[1] = "Nice string";
// ...
WebSerial.send("event-with-array", myArray);

// JSON
JSONVar myObject;
myObject["foo"] = 1;
myObject["secondkey"] = true;
myObject["nested"]["key"] = "hot stuff";
// ...
WebSerial.send("event-with-object", myObject);
```

#### Limiting sent data

In order to prevent overflows and instability, make sure to use short delays if you're constantly sending data, e.g. in your loop function. A short delay of 10 or even 5 milliseconds will be enough most of the time:

```cpp
#include <SimpleWebSerial.h>;
SimpleWebSerial WebSerial;

void setup() {
  Serial.begin(57600);
}

void loop() {
  WebSerial.send("value", analogRead(A0));
  delay(10); // Wait 10 milliseconds between each event
}
```

{% hint style="info" %}
The serial protocol and arduino serial buffer are not made for high throughput. Every character you add to your keys and data reduces the number of times you can receive an event per second. Try to keep your object keys short and don't send unnecessary data!
{% endhint %}

## Methods

### `.check()`

**It is crucial that you call this method in your loop() function.** This method checks if there is serial data to be parsed and delegates it to registered events. Make sure to include it in your loop function like this:

```c
void loop() {
    WebSerial.check();
    // do other stuff
}
```

### `.on(eventname, callback)`

This function defines an event the library should listen to, and the callback that should be executed when the event happens. Please note that when programming for Arduino, **there is a difference between `'` and `"`**, and the latter should be used when defining event names. It's also a strongly typed language, which means we have to specify the type of parameter in our callback, a `JSONVar`. Example:

```c
WebSerial.on("browser-event", doSomething);

// This is our function callback.
// JSONVar is the type of parameter and has to be explicitly specified.
void doSomething(JSONVar parameter) {
    // do something
}
```

#### Arrow- / Lambda functions

If you're a friend of arrow-functions, there is a similar construct in C++ you can use for a familar syntax:

```c
// The example from above, but with a lambda-function as callback, for brevity:
WebSerial.on("browser-event", [](JSONVar data) {
    // Do something
});
```

### `.send(eventname, data)`

Send an event to the browser. First parameter is the event name, second any valid json that is sent to the callback function of the event on the web page. Example:

```javascript
WebSerial.send("darkmode", true); // Send event "darkmode" with payload true

JSONVar obj;
obj["pin"] = 1;
obj["status"] = true;
WebSerial.send("pin-status", obj); // Send event "pin-status" with obj as payload
```

### `.sendEvent(eventname)`

If you just want to send an event without any payload, you can use this helper function. Example:

{% tabs %}
{% tab title="Arduino" %}
```javascript
WebSerial.sendEvent("motionSensor"); // Send event "motionSensor" without payload
```
{% endtab %}

{% tab title="JavaScript" %}
```
connection.on("motionSensor", functionCallback);
```
{% endtab %}
{% endtabs %}

### `.sendData(JSONVar data)`

If you want to send pure data, you can use this. This will omit the event name and can be listened to in the web application via .on("data", callback). Example:

{% tabs %}
{% tab title="Arduino" %}
```javascript
WebSerial.sendData(12345);
```
{% endtab %}

{% tab title="JavaScript" %}
```c
connection.on("data", functionCallback);
```
{% endtab %}
{% endtabs %}

### `.listEvents()`

This function uses Serial.println to print a list of currently registered events on the Arduino. Useful for debugging. Example:

```c
#include <SimpleWebSerial.h>;
SimpleWebSerial WebSerial;

void setup() {
    Serial.begin(57600);
    
    WebSerial.on("first-event", doSomething);
    WebSerial.on("another-event", doSomethingElse);
    WebSerial.listEvents();
}

/* Prints: */

// Listing registered events:
// - first-event
// - another-event
```

### `.log(message)`

This will log a message in the browser's console. Useful for debugging. Example:

```c
#include <SimpleWebSerial.h>;
SimpleWebSerial WebSerial;

void setup() {
    Serial.begin(57600);
    
    WebSerial.log("Arduino has completed setup routine!");
}

// In browser console:
// [ARDUINO] Initial read suggests something's wrong!
```

### `.warn(message)`

This will display a warning in the browser's console. Use it for debugging purposes, or to warn if something bad has happened or is about to happen. Example:

```c
#include <SimpleWebSerial.h>;
SimpleWebSerial WebSerial;

void setup() {
    Serial.begin(57600);
    
    if(!analogRead(A0) > 1) {
        WebSerial.warn("Initial read suggests something's wrong!");
    }
}

// In browser console:
// ⚠ [ARDUINO] Initial read suggests something's wrong!
```

### `.error(message)`

This will display an error in the browser's console. Use for debugging purposes. Example:

```c
#include <SimpleWebSerial.h>;
SimpleWebSerial WebSerial;

void setup() {
    Serial.begin(57600);
    
    if(!analogRead(A0) < 1023) {
        WebSerial.error("Necessary hardware conditions are not met!");
    }
}

// In browser console:
// ❌ [ARDUINO] Necessary hardware conditions are not met!
```
