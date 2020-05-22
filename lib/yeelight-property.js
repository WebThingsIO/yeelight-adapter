'use strict';

const {Property} = require('gateway-addon');

class YeelightProperty extends Property {
  constructor(device, name, description, value) {
    super(device, name, description);
    this.setCachedValue(value);
  }

  setValue(value) {
    const colorModeProp = this.device.properties.get('colorMode');

    const on = this.device.on();

    if (this.name === 'on') {
      return this.device.light.set_power(value ? 'on' : 'off')
        .then(() => {
          this.setCachedValueAndNotify(value);
          return value;
        });
    }

    // only change the other properties if the bulb is already on
    if (!on) {
      return Promise.reject('cannot set property when light is off');
    }

    if (this.name === 'color') {
      const rgb = value.substring(1).match(/../g).map((x) => parseInt(x, 16));
      return this.device.light.set_rgb(rgb)
        .then(() => {
          // update the colorMode property
          if (colorModeProp) {
            colorModeProp.setCachedValueAndNotify('color');
          }

          this.setCachedValueAndNotify(value);
          return value;
        });
    }

    if (this.name === 'level') {
      return this.device.light.set_bright(value)
        .then(() => {
          this.setCachedValueAndNotify(value);
          return value;
        });
    }

    if (this.name === 'colorTemperature') {
      value = Math.max(value, this.minimum);
      value = Math.min(value, this.maximum);

      return this.device.light.set_ct_abx(value)
        .then(() => {
          // update the colorMode property
          if (colorModeProp) {
            colorModeProp.setCachedValueAndNotify('temperature');
          }

          this.setCachedValueAndNotify(value);
          return value;
        });
    }

    return Promise.reject('unknown property');
  }

  /**
   * Update the current value, if necessary.
   */
  update() {
    let value;
    switch (this.name) {
      case 'on':
        value = this.device.on();
        break;
      case 'color':
        value = this.device.color();
        break;
      case 'colorTemperature':
        value = this.device.colorTemp();
        break;
      case 'colorMode':
        value = this.device.colorMode();
        break;
      case 'level':
        value = this.device.brightness();
        break;
    }

    if (value !== this.value) {
      this.setCachedValueAndNotify(value);
    }
  }
}

module.exports = YeelightProperty;
