---
layout: post
title:  "Control RGB LEDs via BlueTooth and Android - Part I (Hardware)"
date:   2013-08-03
post-collection: rgb-android-led
categories: electronics android pic18 bluetooth 
---

This post is about my solution for controlling RGB LEDs with an LED driver,
a microcontroller (PIC18) and a Bluetooth module (HC-05).
Finally I control everything with either a Python script or an Android application.

{% include img src="rgb-led-system-overview.jpg" title="System overview" %}

# LEDs Driver – TI TLC5971

Controlling a LED is quite simple: just use a PWM channel and you’re done!
But when you have to deal with an RGB LED, you need three PWM channels to
do the job, but many microcontrollers don’t have such an availability.
Sure there are many software tricks to obtain 3 or more PWM channels, but
the these are generally not efficient because they keep the CPU busy for
doing almost anything, so it consumes power and has no time to accomplish
other operations like listening to serial connections and other!
At the end, I decided to use an external driver for controlling the LEDs:
this solution is cheaper and simpler than dedicating an entire micro to the
LEDs and another for the control logic, also LED drivers have been designed
on purpose and obviously are better than any hand crafted solution.

{% include img align="right"
    src="rgb-led-led-board.jpg"
    title="TLC-5971 with the adapter and 1 RGB LED" %}

I chose the [TLC5971](http://www.ti.com/product/tlc5971) from Texas Instrument
which has 4 RGB channels (that is, 12 totally) with 16bits DAC resolution and
provides a global brightness control. It is quite cheap, well even free if you
order the samples on TI website. The PWM resolution is quite high because I think
the IC is used also for controlling LED displays, but who cares…?!?!
The driver is easy to be controlled as it needs just two pins: clock and data.
There is no specific interface built into the IC (I2C, SPI,…), there is just a
specification on the packet it expects to receive, and it is actually pretty simple,
as it is a sequence of the colors of all the 4 LEDs. If you need to control more than
4 RGB LEDs you can just connect more TLC5971 in cascade. The IC comes in an SMD
package (20 HTSSOP .65mm pitch), so I soldered it on a PCB adapter (2$ for 5 PCB on ebay).
The absence of a particular interface and the presence of a clock port and a data
port is great advantage in flexibility: it may be used anything to control the driver,
for example I tested it toggling a pin for the clock signal and streaming data on
a GPIO pin. Anyway also SPI or I2C works. I used the second connection scheme
proposed in the datasheet, but this depends on your system configuration and supply:

{% include img
    src="rgb-led-driver-schematic.jpg"
    title="Schematic suggested in TLC5971 datasheet" %}

The important thing on controlling the driver is understanding its messaging protocol: actually only 1 message is allowed. The message is 28 bytes long and is divided as follow:

    0-5 start symbol 0x25
    6-10 configuration flags
    11-31 R, G, B global brightness for all LEDs
    32-223 LED color: 4x LEDs, 3x channels, 16x bits, first LED comes last

The images below (from the datasheet) lack the 6 bits of the write command (0x25).
Also notice that the LED3 comes before the LED0 and for each LED,
the blue channel comes before the green and red.

{% include img
    src="rgb-led-driver-protocol-1.png"
    title="TLC-5971 protocol: function control and global brightness" %}

{% include img
    src="rgb-led-driver-protocol-2.png"
    title="TLC-5971 protocol: channels levels." %}

# Bluetooth – HC05

This project has not a specific application, my intention was to build an RGB
light for room lighting or desktop notifications or whatever.
Then the Bluetooth connectivity seems to be the best trade-off on price, simplicity,
interoperability (any device can use it) and usability (you don’t want to hang a
wire from the ceiling to your laptop!). I used the HC-05 module, which seems to
be pretty famous due to its low price (something like 5$ on ebay).
I bought the user-unfriendly version, which is the one without the 2.54mm header,
so I soldered it with the trick you can see in the pictures. To be honest the
plug-and-play version is not worth the double cost for just few soldering and resistors,
if you have good soldering skills, the rough version is fine, but this is up to you.
If want a hint on soldering the raw board, well be aware that the pitch is pretty odd,
so at the end I ended up with a prototyping board and some male headers.
I used the headers to fix the Bluetooth board on the prototyping one using
the same approach of embedding a gem on a jewel.

{% include img
    src="rgb-led-bluetooth-front.jpg"
    title="PCB embedded like a 'gem on a ring'"%}

{% include img
    src="rgb-led-bluetooth-back.jpg"
    title="Only few pins are needed: GND, 3.3V, TX, RX and KEY"%}

The module is configurable through AT commands, anyway it should run without
any further configuration. Please notice that by default the baudrate is
9600 and the password is 1234.

# Microcontroller – PIC18F4550

For this project I used a PIC18F4550, but honestly is highly oversized.
This MCU has so many features and computational capability that is really
a waste for this application. You can use any microcontroller with the
only requirement of providing an USART port for the Bluetooth or more in
general to be able to communicate with a Bluetooth module or with another
radio module or whatever exotic connection you chose.

{% include img
    src="rgb-led-mcu-board.jpg"
    title="The main breadboard featuring the MCU and the BT module" %}

The MCU has two main tasks to accomplish: first of all it listens to
the UART for incoming messages and when a message arrives, it colors a LED.
