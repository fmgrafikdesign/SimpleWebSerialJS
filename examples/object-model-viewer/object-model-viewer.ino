#include <SimpleWebSerial.h>

SimpleWebSerial WebSerial;

// Predefine the variable so it doesn't have to be allocated each loop.
JSONVar rotation;

// the setup routine runs once when you press reset / connect to the Arduino:
void setup() {
  // initialize serial communication at 57600 bits per second:
  Serial.begin(57600);
}

// the loop routine runs over and over again forever:
void loop() {
  rotation["x"] = analogRead(A0);
  rotation["y"] = analogRead(A1);
  rotation["z"] = analogRead(A2);
  
  WebSerial.send("r", rotation);

  delay(10);        // delay in between reads for stability
}
