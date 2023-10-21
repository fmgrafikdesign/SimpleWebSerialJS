# Troubleshooting

## List with keywords in no particular order or completeness

* If  you get an error message when trying to open the serial connection, make sure you are using the same baud rate in your web application and on your Arduino. The default baud rate used by the JavaScript library is _57600_. Use _Serial.begin(57600)_ in the _setup_ function of your Arduino sketch.
* If you get an error message when trying to upload your sketch to your Arduino, make sure the web application isn't still occupying the serial port! Refreshing the page will close the serial connection.
* If you feel like your web application is very unresponsive to incoming data, try _increasing_ the delay used in your Arduino application by a few milliseconds. If the used delay is too small, too many events might be sent at any given time, overwhelming your web application.



* baud rate
* event rate
* used internal event names
* flag enabled?
* access element must exist when creating library instance



