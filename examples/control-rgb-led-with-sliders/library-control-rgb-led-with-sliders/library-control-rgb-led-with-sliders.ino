#include <SimpleWebSerial.h>

const int analogInPin = A0;  // Analog input pin that the potentiometer is attached to
const int analogOutPin = 9; // Analog output pin that the LED is attached to

int sensorValue = 0;        // value read from the pot
int outputValue = 0;        // value output to the PWM (analog out)

int r = 4;
int g = 5;
int b = 3;

SimpleWebSerial instance;

char rgb[] = {0, 0, 0};

void function2() {
    Serial.println("Callback called");
}

void setLEDs() {
    Serial.println("setLEDs called");
}

void function3() {
    Serial.println("Callback for 2nd event called");
}


void setup() {
  // initialize serial communications at 9600 bps:
  Serial.begin(9600);
  instance = SimpleWebSerial();
  instance.setCallback(function2);

  pinMode(r, OUTPUT);
  pinMode(g, OUTPUT);
  pinMode(b, OUTPUT);

  instance.on("values", setLEDs);
  instance.on("second", function3);
  // instance.onData(function2);
  delay(100);
  instance.listEvents();
}

/*
void setLed(values) {
  // if you're using a common-cathode LED, just use "constrain(color, 0, 255);"
  red = 255 - constrain(values["red"], 0, 255);
  green = 255 - constrain(values["green"], 0, 255);
  blue = 255 - constrain(values["blue"], 0, 255);

  // fade the red, green, and blue legs of the LED:
  analogWrite(r, red);
  analogWrite(g, green);
  analogWrite(b, blue);

  // print the three numbers in one string as hexadecimal:
  SerialWebLibrary.send("hexadecimal", "#" + hex(red) + "" + hex(green) + "" + hex(blue));
}
*/

void loop() {
  instance.check();
}
