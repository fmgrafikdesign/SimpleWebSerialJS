#include <SimpleWebSerial.h>

SimpleWebSerial WebSerial;

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 57600 bits per second:
  Serial.begin(57600);
}

// the loop routine runs over and over again forever:
void loop() {
  // read the input on analog pin 0:
  char str[80];
  sprintf(str, "It has been %lu ms since Arduino has started this program!", millis());
  WebSerial.send("log", str);
  delay(50);        // delay in between reads for stability
}
