#include <SimpleWebSerial.h>

SimpleWebSerial WebSerial;

int h, v;

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 57600 bits per second:
  Serial.begin(57600);
}

// the loop routine runs over and over again forever:
void loop() {
  // read the input on analog pin 0:
  h = analogRead(A0);
  v = analogRead(A1);
  WebSerial.send("h", map(h, 0, 1023, 1, 49));
  WebSerial.send("v", map(v, 0, 1023, 1, 49));

  delay(20);        // delay in between reads for stability
}
