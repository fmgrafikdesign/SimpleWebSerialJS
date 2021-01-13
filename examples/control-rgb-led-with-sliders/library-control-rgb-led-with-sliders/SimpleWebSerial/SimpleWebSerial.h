/*
  SimpleWebSerial.h - Library to easily connect your Arduino to a web application.
  Created by Fabian Mohr, 2020.
  Released into the public domain.
*/

#ifndef SimpleWebSerial_h
#define SimpleWebSerial_h

#include "Arduino.h"

class SimpleWebSerial {
public:
    SimpleWebSerial();
    void on(); // Event name, callback
    void send(); // Event name, data or just data
};

#endif