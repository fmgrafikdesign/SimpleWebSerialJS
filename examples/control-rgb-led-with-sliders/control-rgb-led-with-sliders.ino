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
long number = 0;
SimpleWebSerial WebSerial;

void function1(JSONVar data) {
  Serial.println("Function 1 called with parameters");
  Serial.println(JSON.stringify(data));
  // WebSerial.send("hexadecimal", "whatever");
}

void function2(JSONVar data) {
  Serial.println("Function 2 called");
}

void function3(JSONVar data) {
  Serial.println("Function 3 called");
}

void setup() {
  // initialize serial communications
  Serial.begin(57600);
  pinMode(r, OUTPUT);
  pinMode(g, OUTPUT);
  pinMode(b, OUTPUT);

  // Let's try some lambda magic - works
  WebSerial.on("lambda", [](JSONVar data) {
    WebSerial.send("vialambda", "some params");
  });
  WebSerial.on("ledon", function2);


  WebSerial.on("values", setLed);

  WebSerial.on("parse", [](JSONVar data) {
    Serial.println(JSON.parse(data));
    Serial.println(JSON.typeof(JSON.parse(data)));
  });

  WebSerial.on("goodone", [](JSONVar data) {
    Serial.println("event good one called!");
  });

  WebSerial.on("data", [](JSONVar data) {
    Serial.println(JSON.stringify(data));
  });

  //WebSerial.send("hello there!");
  //WebSerial.setCallback(function1);
  // WebSerial.listEvents();
}


void setLed(JSONVar values) {
  //Serial.println(JSON.stringify(values));
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
  //WebSerial.sendEvent("hexadecimal");
  // WebSerial.send("hexadecimal", values);

/*
Serial.print(JSON.typeof(values["r"]));
  Serial.print('+');
  Serial.print(JSON.typeof(values["g"]));
  Serial.print('+');
  Serial.println(JSON.typeof(values["b"]));
*/
  /*
  Serial.print(red);
  Serial.print('+');
  Serial.print(green);
  Serial.print('+');
  Serial.println(blue);
  */
}


void loop() {
  // Serial.println("running loop");
  WebSerial.check();
  number++;
  delay(2);
}
