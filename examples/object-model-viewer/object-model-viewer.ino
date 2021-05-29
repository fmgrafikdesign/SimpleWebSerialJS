#include <SparkFunLSM9DS1.h>
#include <SimpleWebSerial.h>

LSM9DS1 imu;
SimpleWebSerial WebSerial; // Create an istance of the library
JSONVar rotation; // Define the rotation variable once at the beginning, to save performance.
#define PRINT_SPEED 16 // 16 ms between events, which adds up to approx. 60 events per second
static unsigned long lastPrint = 0; // Keep track of print time

void setup()
{
  Serial.begin(57600);

  Wire.begin();
}

void loop()
{
  if ((lastPrint + PRINT_SPEED) < millis()) // Establish a basic "x times per second" routine.
  {
    float pitch = PI * 180.0 / PI;
    float roll  = PI * 180.0 / PI;

    /*
    float roll = atan2(imu.ay, imu.az);
    float pitch = atan2(-imu.ax, sqrt(imu.ay * imu.ay + imu.az * imu.az));

    // Convert everything from radians to degrees:
    pitch *= 180.0 / PI;
    roll  *= 180.0 / PI;
    */
    
    rotation["x"] = pitch;
    rotation["y"] = roll;
    
    // Send the event with JSON variable as parameter to the web application
    WebSerial.send("r", rotation);

    lastPrint = millis(); // Update lastPrint time
  }
}
