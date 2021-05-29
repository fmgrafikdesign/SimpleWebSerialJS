#include <SimpleWebSerial.h>
SimpleWebSerial WebSerial;

int pin_led_x = 3;
int pin_led_y = 5;

// the setup routine runs once when you press reset:
void setup() {
  Serial.begin(57600);

  WebSerial.on("p", [](JSONVar data) {
    analogWrite(pin_led_x, data[0]);
    analogWrite(pin_led_y, data[1]);
  });
}

// the loop routine runs over and over again forever:
void loop() {
  // WebSerial needs to check if there is serial data
  WebSerial.check();
}
