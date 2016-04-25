---
layout: post
title:  "Control RGB LEDs via BlueTooth and Android - Part II (Software)"
date:   2013-08-07
post-collection: rgb-android-led
categories: electronics android pic18 bluetooth 
---

In this last part I'll cover the MCU firmware and the client apps.

# MCU firmware

The PIC18 MCU has two main tasks to accomplish: first of all it listens to the
UART for incoming messages and when a message arrives, it colors a LED.
I defined a very simple messaging protocol for the purpose, that is, a sequence
of bytes containing a color in the RGB form. The message is the following:

* 1st byte is the Start symbol (0xFE);
* 6 bytes for the payload containing the color: 2 bytes each for R,G and B channels.
* escape byte (0xFD)

Any byte in the payload that is 0xFE must be escaped with the *escape byte* and also
the escape byte itself must be escaped!

Here a snippet of the MCU firmware:

{% include github-gist id="f40c92e65321267314a43f2e01800e5e" %}

The `parseSerialMsg(void)` function is the serial message parser which is called as
soon as a new byte is received on the UART.

The parser calls the function `paintLED(char* colors)` when a full message
is found and controls the LED driver (RB0 is the data line, RB1 is the clock)
to actually set a color on the LED. Please notice that the above function controls only
the first LED (LED0), while the other are off, that's because I only connected 1 LED...
shame on me.

What is left in the firmware, is just the interrupt routine called every time a byte is
received in the UART RX buffer, `highISR()`.

You can download the entire firmware source code here:

{% include attach filename="rgbled-pic-firmware.zip" %}

# Python client

Controlling the Bluetooth from a PC is pretty easy as the BlueTooth connection can
be treated as a serial port. In Python you can turn an LED on with 3 lines of code:

{% highlight python %}
import serial
ser = Serial.serial('/dev/rfcomm0', 9600) # open the serial port
ser.write('\xFE\xFF\xFF\x00\x00\x00\x00') # turns the LED red
{% endhighlight %}

Please notice that you need to connect the BlueTooth module to your PC
and to open a serial port. Sometimes the operative system just establishes
a link but does not create the /dev, for example in Arch Linux I use rfcomm
to open the port:

{% highlight bash %}
hcitool scan # obtain some MACs
rfcomm connect bt_mac_here
{% endhighlight %}

# Android app

The Android app is conceptually simple as it just reads the RGB values from
3 sliders or the colors from a drop-down and then sends a message via Bluetooth.
Anyway the Bluetooth management is not so easy, as you need to handle disconnections,
re-connections etc…, but fortunately the Android documentation is rich and there is
also a good sample app that implements a Bluetooth chat with a lot of examples.
Finally I built the LEDs control app modifying the original Bluetooth chat app.

{% include img
    src="rgb-led-android-screen.png"
    title="RGB sliders and dropdown list for the colors,
    serial raw messages are for debug purpose" %}

The modified BT chat application just brings 3 sliders and a dropdown menu on the GUI side.
Then I modified the send function adding the creation of a message with a start byte (0xFE),
6 bytes from the values of the sliders and eventually some escape characters.
You can find the source code of the Android application on
[GitHub](https://github.com/lucafaggianelli/android-rgb-led).

In this video you can appreciate the crappy quality of my webcam
and if you can also the android app in action...and yes that is a ping pong ball
to diffuse the LED light.

{% include youtube id="KrkRMNkkQjI" %}
