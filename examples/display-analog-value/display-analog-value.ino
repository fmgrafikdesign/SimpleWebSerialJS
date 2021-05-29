#include <SimpleWebSerial.h>
SimpleWebSerial WebSerial;

// the setup routine runs once when you press reset:
void setup() {
  Serial.begin(57600);
}

// the loop routine runs over and over again forever:
void loop() {
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);
  WebSerial.send("value", sensorValue);
  delay(5);        // delay in between reads for stability
}
