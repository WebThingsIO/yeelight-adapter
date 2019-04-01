# yeelight-adapter

Yeelight smart bulb adapter for Mozilla WebThings Gateway.

# Supported Devices

**NOTE**: Devices need to have Developer Mode (a.k.a. LAN Control) enabled before they can be controlled. To enable this feature:
1. Add the bulb to the Yeelight app.
2. Click on the bulb you just added.
3. In the advanced features menu (looks like an up arrow in the bottom right corner), click on "LAN Control".
4. Toggle the switch on.

## Tested and Working

LED Bulb II (Color) - Model YLDP06YL

## Untested but _Should Work_

All other lights.

# Requirements

If you're running this add-on outside of the official gateway image for the Raspberry Pi, i.e. you're running on a development machine, you'll need to do the following (adapt as necessary for non-Ubuntu/Debian):

```
sudo apt install python3-dev libnanomsg-dev
sudo pip3 install nnpy
sudo pip3 install git+https://github.com/mozilla-iot/gateway-addon-python.git
```
