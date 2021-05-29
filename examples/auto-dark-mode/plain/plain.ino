bool darkmode = false;
// We use a second bool variable to track changes in darkmode, so we only send events when necessary
bool previous = false;

// the setup routine runs once when you press reset / connect to the Arduino:
void setup() {
  // initialize serial communication at 57600 bits per second:
  Serial.begin(57600);
}

// the loop routine runs over and over again forever:
void loop() {
  // Depending on your LDR, you might have to adjust this threshold.
  // Use the Serial.print command in the following line to get a feel for the values you get from you LDR while covering / not covering it.
  // Serial.println(analogRead(0));
  if(analogRead(A0) > 1000) {
    darkmode = true;
  } else {
    darkmode = false;
  }

  if(previous != darkmode) {
    Serial.println(darkmode);
  }
  previous = darkmode;
  delay(50);        // delay in between reads for stability
}
