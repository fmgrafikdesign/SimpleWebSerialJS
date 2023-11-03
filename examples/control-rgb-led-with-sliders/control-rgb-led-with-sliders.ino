#include <SimpleWebSerial.h>

// These constants won't change. They're used to give names to the pins used:
const int analogInPin = A0;  // Analog input pin that the potentiometer is attached to
const int analogOutPin = 9; // Analog output pin that the LED is attached to

int sensorValue = 0;        // value read from the pot
int outputValue = 0;        // value output to the PWM (analog out)

int r = 6;
int g = 5;
int b = 3;

char rgb[] = {0, 0, 0};
SimpleWebSerial WebSerial;

void setup() {
  // initialize serial communications
  Serial.begin(57600);
  pinMode(r, OUTPUT);
  pinMode(g, OUTPUT);
  pinMode(b, OUTPUT);

  WebSerial.on("values", setLed);
}


void setLed(JSONVar values) {
  // if you're using a common-cathode LED, just use "constrain(color, 0, 255);"
  int red = 255 - constrain((int)values["r"], 0, 255);
  int green = 255 - constrain((int)values["g"], 0, 255);
  int blue = 255 - constrain((int)values["b"], 0, 255);

  // fade the red, green, and blue legs of the LED:
  analogWrite(r, red);
  analogWrite(g, green);
  analogWrite(b, blue);

  // print the three numbers in one string as hexadecimal:
  char format[8];
  sprintf(format, "#%02X%02X%02X", (int)values["r"], (int)values["g"], (int)values["b"]);
  WebSerial.send("hexadecimal", format);
}


void loop() {
  WebSerial.check();
  delay(2);
}
