#define MaximumEventNameLength 24
#include <SimpleWebSerial.h>
SimpleWebSerial WebSerial;

int counter = 0;

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 57600 bits per second:
  Serial.begin(57600);

  // We listen for the ping event and define a callback for it.
  // This time, we use a lambda function, the equivalent to an arrow function in JavaScript.
  WebSerial.on("ping", [](JSONVar data) {
    counter++;
    WebSerial.send("pong", counter);
  });
}

/* The lambda function defined above is the equivalent to this: */
/*
 * void sendPongEvent (JSONVar data) {
 *    WebSerial.sendEvent("pong");
 * }
 *
 */

// the loop routine runs over and over again forever:
void loop() {
  // WebSerial needs to check if there is serial data
  WebSerial.check();
}
