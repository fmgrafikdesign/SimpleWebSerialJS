#include <SimpleWebSerial.h>

SimpleWebSerial WebSerial;

const int ledPin = 2;
void setup() {
  // initialize serial communications
  Serial.begin(57600);
  pinMode(ledPin, OUTPUT);

  WebSerial.on("led", toggleLed)
}

void toggleLed(JSONVar state) {
    if(state == true) {
        digitalWrite(ledPin, HIGH);
    } else {
        digitalWrite(ledPin, LOW);
    }
}

void loop() {
  WebSerial.check();
  delay(5);
}
