#include <SimpleWebSerial.h>

SimpleWebSerial WebSerial;

long unsigned reset = millis();

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 57600 bits per second:
  Serial.begin(57600);

  // Listen for the reset event
  WebSerial.on("reset", resetCounter);
}

void resetCounter(JSONVar param) {
  reset = millis();
  WebSerial.send("log", "Counter has been reset!");
}

// the loop routine runs over and over again forever:
void loop() {
  // WebSerial needs to check if there is serial data
  WebSerial.check();
  
  char str[80];
  sprintf(str, "It has been %lu ms since the last reset!", millis() - reset);
  WebSerial.send("log", str);
  delay(250);        // delay in between reads for stability
}
