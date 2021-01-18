#include <SimpleWebSerial.h>

SimpleWebSerial WebSerial;

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 57600 bits per second:
  Serial.begin(57600);
}

// the loop routine runs over and over again forever:
void loop() {
  bool darkmode = false;
  if(analogRead(A0) > 1000) {
    darkmode = true;
  }
  WebSerial.send("darkmode", darkmode);
  delay(50);        // delay in between reads for stability
}
