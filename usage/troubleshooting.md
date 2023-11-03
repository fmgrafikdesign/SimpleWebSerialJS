# Troubleshooting

* If  you get an error message when trying to open the serial connection, you may try one or more of these:
  * Make sure you are using the same baud rate in your web application and on your Arduino. The default baud rate used by the JavaScript library is `57600`. Use `Serial.begin(57600)` in the `setup` function of your Arduino sketch.
  * Make sure the serial port is not already in use, e.g. by another browser window or process.
  * Make sure your browser supports the Web Serial API. Roughly speaking, recent versions of (desktop) Chrome or Edge support it. A full list: can be found [here](https://caniuse.com/web-serial).
* If no event seems to be sent or read correctly, make sure you're using the same baud rate on both Arduino and web application
* If you get an error message when trying to upload your sketch to your Arduino, make sure the web application isn't still occupying the serial port! Refreshing the page will close the serial connection.
* If you feel like your web application is very unresponsive to incoming data, try increasing the delay used in your Arduino application by a few milliseconds. If the used delay is too small, too many events might be sent at any given time, overwhelming your web application.





