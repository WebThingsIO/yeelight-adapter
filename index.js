'use strict';

const YeelightAdapter = require('./lib/yeelight-adapter');

module.exports = (addonManager) => {
  new YeelightAdapter(addonManager);
};
