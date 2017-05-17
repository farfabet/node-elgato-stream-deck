'use strict';

// Native
const EventEmitter = require('events');

// Packages
const HID = require('node-hid');

const NUM_KEYS = 15;
const keyState = new Array(NUM_KEYS).fill(false);
const devices = HID.devices();
const streamDecks = devices.filter(device => {
	return device.product === 'Stream Deck' && device.manufacturer === 'Elgato Systems';
});

if (streamDecks.length > 1) {
	throw new Error('More than one Stream Deck is connected. This is unsupported at this time.');
}

class StreamDeck extends EventEmitter {
	constructor(streamDeck) {
		super();
		this.streamDeck = streamDeck;

		this.streamDeck.on('data', data => {
			// The first byte is a report ID, the last byte appears to be padding
			// strip these out for now.
			data = data.slice(1, data.length - 1);

			for (let i = 0; i < NUM_KEYS; i++) {
				const keyPressed = Boolean(data[i]);
				if (keyPressed !== keyState[i]) {
					if (keyPressed) {
						this.emit('down', i);
					} else {
						this.emit('up', i);
					}
				}

				keyState[i] = keyPressed;
			}
		});

		this.streamDeck.on('error', err => {
			this.emit('error', err);
		});
	}
}

module.exports = new StreamDeck(new HID.HID(streamDecks[0].path));
