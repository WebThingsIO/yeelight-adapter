'use strict';

const {Adapter} = require('gateway-addon');
const {Client} = require('yeelight-node');
const manifest = require('../manifest.json');
const qs = require('querystring');
const YeelightDevice = require('./yeelight-device');

class YeelightAdapter extends Adapter {
  constructor(addonManager) {
    super(addonManager, manifest.id, manifest.id);
    addonManager.addAdapter(this);

    this.lightInfo = new Map();
    this.client = new Client();
    this.client.bind(this.onDeviceDiscovered.bind(this));
    this.client.socket.prependListener('message', (message) => {
      const data = qs.parse(message.toString(), '\r\n', ': ');
      this.lightInfo.set(data.id, data);
    });
  }

  startPairing() {
    this.client.search();
  }

  onDeviceDiscovered(light) {
    const id = `yeelight-${light.id}`;
    if (!this.devices[id]) {
      const device =
        new YeelightDevice(this, id, this.lightInfo.get(light.id), light);
      this.handleDeviceAdded(device);
    }
  }

  unload() {
    return new Promise((resolve) => {
      this.client.socket.close(() => resolve());
    });
  }

  removeThing(device) {
    super.removeThing(device);

    if (device.light && device.light.id) {
      this.client.lights =
        this.client.lights.filter((l) => l.id !== device.light.id);
    }
  }
}

module.exports = YeelightAdapter;
