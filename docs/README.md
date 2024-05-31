---
description: >-
  SimpleWebSerial helps you to connect an Arduino with your web application, in
  seconds.
---

# Introduction

<figure><img src=".gitbook/assets/titelbild-v4.jpg" alt=""><figcaption></figcaption></figure>

## What is this library?

This library allows you to connect your website in the browser with an Arduino microcontroller. This effectively means the real world can influence your web application, and vice versa. The library consists of two parts, the [JavaScript part](https://github.com/fmgrafikdesign/SimpleWebSerialJS) which runs in the browser, and the [Arduino part](https://github.com/fmgrafikdesign/simplewebserial-arduino-library) which is installed on your Arduino device. Together, they allow you to write simple, event-driven code both in JavaScript and on the Arduino, enabling two-way communication.

Under the hood, it uses the [Web Serial API](https://wicg.github.io/serial/). It handles repetitive setup steps and offers an event-driven style of listening to and sending data. The goal is to allow as many people as possible to explore the possibilities of connecting physical devices to web applications.

## Code Style Summary

This library employs an event-driven code style. You can register event listeners with callback functions, and send events to the other device. Here's a brief idea how working with the library looks like in the browser and on the Arduino:

### JavaScript

```javascript
import { setupSerialConnection } from 'simple-web-serial';

// Set up the serial connection
const connection = setupSerialConnection({ requestAccessOnPageLoad: true });

// React to incoming events
connection.on('event-from-arduino', function(data) {
    console.log('Received event "event-from-arduino" with parameter ' + data)
});

// Send named events to the Arduino with a number, string, array or json object
connection.send('event-to-arduino', "Hello there, Arduino");
```

### Arduino

```cpp
// Include the library
#include <SimpleWebSerial.h>

// Create an instance of the library
SimpleWebSerial WebSerial;

void setup() {
  // Initialize serial communication
  Serial.begin(57600);
  
  // Define events to listen to and their callback
  WebSerial.on("event-to-arduino", eventCallback); 
  
  // Send named events to browser with a number, string, array or json object
  WebSerial.send("event-from-arduino", 123);
}

void eventCallback(JSONVar data) {
    // Do something, even sending events right back!
    WebSerial.send("event-from-arduino", data);
});

void loop() {
  // Check for new serial data every loop
  WebSerial.check();
  delay(5);
}
```

## Why this library?

The new [Web Serial API](https://wicg.github.io/serial/) is a great way to connect serial devices like the Arduino directly to your web application. It lets your website communicate with the real world, and opens up a lot of possibilities for web developers! However, working with it is cumbersome and very technical. You're left to deal with things like byte-arrays and parsing data. This library makes connecting your web application with an Arduino a breeze, and lets you get up and running in minutes.

## Who is this for?

This library is for creative minds and developers who like to experiment and create prototypes, but do not necessarily care how something works on the technical level.

Do you know your way around web development? Basic concepts like HTML, JavaScript? Then you can use this without problems.

Do you like experimenting with new web technologies, maybe learn a new thing or two? This library will give you an idea what's possible when we integrate websites with the real world.

## Getting Started

Get started by installing the [JavaScript library](https://github.com/fmgrafikdesign/SimpleWebSerialJS) and the [Arduino library](https://github.com/fmgrafikdesign/simplewebserial-arduino-library). Alternatively you can check out the repository and have a look at the [examples](https://github.com/fmgrafikdesign/SimpleWebSerialJS/tree/main/examples) folder. Be aware, you will need an Arduino for all of them, and some hardware parts (LEDs, potentiometer etc) for most of them.
