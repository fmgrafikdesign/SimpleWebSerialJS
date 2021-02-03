#include <SimpleWebSerial.h>

SimpleWebSerial WebSerial;

long unsigned reset = millis();
int counter = 0;

const int buttonPin = 2;     // the number of the pushbutton pin

// variables will change:
int buttonState = 0;         // variable for reading the pushbutton status
int lastState = LOW;           // save the last button state so we can only report changes

void setup() {
  // initialize the pushbutton pin as an input:
  Serial.begin(57600);
  pinMode(buttonPin, INPUT);
}

void loop() {
  // read the state of the pushbutton value:
  buttonState = digitalRead(buttonPin);

  // If it wasn't on before but is now, send an event
  if(lastState == LOW && buttonState == HIGH) {
    WebSerial.sendEvent("cat-fact");
  }

  lastState = buttonState;
}
