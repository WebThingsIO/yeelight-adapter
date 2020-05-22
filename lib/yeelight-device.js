'use strict';

const Color = require('color');
const {Device} = require('gateway-addon');
const YeelightProperty = require('./yeelight-property');

// eslint-disable-next-line max-len
// From: https://gitlab.com/stavros/python-yeelight/-/blob/master/yeelight/main.py
const MODEL_SPECS = {
  mono: {
    colorTemp: {
      min: 2700,
      max: 2700,
    },
    nightLight: false,
    backgroundLight: false,
  },
  mono1: {
    colorTemp: {
      min: 2700,
      max: 2700,
    },
    nightLight: false,
    backgroundLight: false,
  },
  color: {
    colorTemp: {
      min: 1700,
      max: 6500,
    },
    nightLight: false,
    backgroundLight: false,
  },
  color1: {
    colorTemp: {
      min: 1700,
      max: 6500,
    },
    nightLight: false,
    backgroundLight: false,
  },
  strip1: {
    colorTemp: {
      min: 1700,
      max: 6500,
    },
    nightLight: false,
    backgroundLight: false,
  },
  bslamp1: {
    colorTemp: {
      min: 1700,
      max: 6500,
    },
    nightLight: false,
    backgroundLight: false,
  },
  bslamp2: {
    colorTemp: {
      min: 1700,
      max: 6500,
    },
    nightLight: true,
    backgroundLight: false,
  },
  ceiling1: {
    colorTemp: {
      min: 2700,
      max: 6500,
    },
    nightLight: true,
    backgroundLight: false,
  },
  ceiling2: {
    colorTemp: {
      min: 2700,
      max: 6500,
    },
    nightLight: true,
    backgroundLight: false,
  },
  ceiling3: {
    colorTemp: {
      min: 2700,
      max: 6500,
    },
    nightLight: true,
    backgroundLight: false,
  },
  ceiling4: {
    colorTemp: {
      min: 2700,
      max: 6500,
    },
    nightLight: true,
    backgroundLight: true,
  },
  color2: {
    colorTemp: {
      min: 2700,
      max: 6500,
    },
    nightLight: false,
    backgroundLight: false,
  },
  ceiling13: {
    colorTemp: {
      min: 2700,
      max: 6500,
    },
    nightLight: true,
    backgroundLight: false,
  },
};

class YeelightDevice extends Device {
  constructor(adapter, id, info, light) {
    super(adapter, id);
    this.name = info.name || info.model;
    this.description = info.model;
    this.light = light;
    this.info = info;
    this.support = info.support.split(' ');
    this['@type'] = ['Light'];

    if (this.isColor()) {
      this['@type'].push('ColorControl');

      this.properties.set('color', new YeelightProperty(
        this,
        'color',
        {
          '@type': 'ColorProperty',
          title: 'Color',
          type: 'string',
        },
        this.color()
      ));
    }

    if (this.isVariableColorTemp()) {
      if (!this['@type'].includes('ColorControl')) {
        this['@type'].push('ColorControl');
      }

      let minKelvin = 1700, maxKelvin = 6500;
      if (this.light.model && MODEL_SPECS[this.light.model]) {
        minKelvin = MODEL_SPECS[this.light.model].colorTemp.min;
        maxKelvin = MODEL_SPECS[this.light.model].colorTemp.max;
      }

      this.properties.set('colorTemperature', new YeelightProperty(
        this,
        'colorTemperature',
        {
          '@type': 'ColorTemperatureProperty',
          title: 'Color Temperature',
          type: 'integer',
          unit: 'kelvin',
          minimum: minKelvin,
          maximum: maxKelvin,
        },
        this.colorTemp()
      ));
    }

    if (this.isColor() && this.isVariableColorTemp()) {
      this.properties.set('colorMode', new YeelightProperty(
        this,
        'colorMode',
        {
          '@type': 'ColorModeProperty',
          title: 'Color Mode',
          type: 'string',
          enum: [
            'color',
            'temperature',
          ],
          readOnly: true,
        },
        this.colorMode()
      ));
    }

    if (this.isDimmable()) {
      this.properties.set('level', new YeelightProperty(
        this,
        'level',
        {
          '@type': 'BrightnessProperty',
          title: 'Brightness',
          type: 'integer',
          unit: 'percent',
          minimum: 0,
          maximum: 100,
        },
        this.brightness()
      ));
    }

    this.properties.set('on', new YeelightProperty(
      this,
      'on',
      {
        '@type': 'OnOffProperty',
        title: 'On/Off',
        type: 'boolean',
      },
      this.on()
    ));

    this.reconnectBackoff = 1000;

    this.light.client.setKeepAlive(true);
    this.light.client.on('connect', this.onClientConnect.bind(this));
    this.light.client.on('close', this.onClientClose.bind(this));
    this.light.client.on('error', this.onClientClose.bind(this));
    this.light.client.on('data', this.onClientData.bind(this));
    this.light._connect();
  }

  onClientConnect() {
    this.connectedNotify(true);
    this.reconnectBackoff = 1000;
  }

  onClientClose() {
    // the library doesn't do this cleanly and leaks listeners
    this.light.client.removeAllListeners('close');
    this.light.client.removeAllListeners('error');
    this.light.client.removeAllListeners('data');

    this.connectedNotify(false);
    const backoff = this.reconnectBackoff;
    this.reconnectBackoff = Math.min(30000, this.reconnectBackoff * 2);
    setTimeout(() => {
      this.light.client.on('close', this.onClientClose.bind(this));
      this.light.client.on('error', this.onClientClose.bind(this));
      this.light.client.on('data', this.onClientData.bind(this));
      this.light._connect();
    }, backoff);
  }

  onClientData(data) {
    try {
      const message = JSON.parse(data);
      if (!message || message.method !== 'props' || !message.params) {
        return;
      }

      this.info = Object.assign(this.info, message.params);
      this.properties.forEach((prop) => prop.update());
    } catch (_) {
      // pass
    }
  }

  isDimmable() {
    return this.support.includes('set_bright');
  }

  isColor() {
    return this.support.includes('set_rgb') && this.support.includes('set_hsv');
  }

  isVariableColorTemp() {
    return this.support.includes('set_ct_abx');
  }

  on() {
    return this.info.power === 'on';
  }

  colorTemp() {
    return parseInt(this.info.ct, 10);
  }

  color() {
    const mode = parseInt(this.info.color_mode, 10);

    switch (mode) {
      case 1:
        // RGB mode
        return `#${parseInt(this.info.rgb, 10).toString(16).padStart(6, '0')}`;
      case 3:
        // HSV mode
        return Color(
          {
            h: parseInt(this.info.hue, 10),
            s: parseInt(this.info.sat, 10),
            v: parseInt(this.info.bright, 10),
          }
        ).hex();
      default:
        // Color temperature mode
        return '#000000';
    }
  }

  colorMode() {
    const mode = parseInt(this.info.color_mode, 10);
    if (mode === 2) {
      return 'temperature';
    }

    return 'color';
  }

  brightness() {
    return parseInt(this.info.bright, 10);
  }
}

module.exports = YeelightDevice;
