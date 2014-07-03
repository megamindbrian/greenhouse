/*
 * rht03.c:
 *      Driver for the MaxDetect series sensors
 *
 * Copyright (c) 2012-2013 Gordon Henderson. <projects@drogon.net>
 ***********************************************************************
 * This file is part of wiringPi:
 *      https://projects.drogon.net/raspberry-pi/wiringpi/
 *
 *    wiringPi is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU Lesser General Public License as published b                                                                                                             y
 *    the Free Software Foundation, either version 3 of the License, or
 *    (at your option) any later version.
 *
 *    wiringPi is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Lesser General Public License for more details.
 *
 *    You should have received a copy of the GNU Lesser General Public License
 *    along with wiringPi.  If not, see <http://www.gnu.org/licenses/>.
 ***********************************************************************
 */

#include <stdio.h>
#include <time.h>

#include <wiringPi.h>
#include <maxdetect.h>

#define RHT03_PIN       7

/*
 ***********************************************************************
 * The main program
 ***********************************************************************
 */

int main (void)
{
  int temp, rh ;
  float  temp2 ;
  int newTemp, newRh ;

  temp = rh = newTemp = newRh = 0 ;

  wiringPiSetup () ;
  piHiPri       (55) ;

  for(;;)
  {

    if (!readRHT03 (RHT03_PIN, &newTemp, &newRh))
    {
      delay(57);
      continue;
    }

    if ((temp != newTemp) || (rh != newRh))
    {
      temp = newTemp ;
      temp2 = (9.0 / 5) * (newTemp / 10) + 32;
      rh   = newRh ;
      fprintf (stdout, "celsius=%.2f&fahrenheit=%.2f&humidity=%.2f&time=%u\n", temp / 10.0, temp2, rh / 10.0, (unsigned)time(NULL)) ;
      fflush(stdout);
    }

    delay(23000);
  }

  return 0 ;
}
