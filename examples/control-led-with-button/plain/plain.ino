const int ledPin = 2;
void setup() {
  // initialize serial communications at 9600 bps:
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  if(Serial.available()) {
    int inByte = Serial.read();
    if(inByte == 0) {
        digitalWrite(ledPin, HIGH);
    } else if (inByte == 1) {
        digitalWrite(ledPin, LOW);
    }
  }
  delay(5);
}
