#include <SimpleWebSerial.h>

SimpleWebSerial WebSerial;

int value;

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 57600 bits per second:
  Serial.begin(57600);
}

// the loop routine runs over and over again forever:
void loop() {
  // read the input on analog pin 0:
  value = analogRead(A0);
  WebSerial.sendData(map(value, 0, 1023, 0, 48));
  
  delay(50);        // delay in between reads for stability
}
