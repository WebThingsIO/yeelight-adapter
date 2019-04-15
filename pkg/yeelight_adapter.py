"""Yeelight adapter for Mozilla WebThings Gateway."""

from gateway_addon import Adapter
from yeelight import discover_bulbs

from .yeelight_device import YeelightDevice


_TIMEOUT = 3


class YeelightAdapter(Adapter):
    """Adapter for Yeelight smart bulbs."""

    def __init__(self, verbose=False):
        """
        Initialize the object.

        verbose -- whether or not to enable verbose logging
        """
        self.name = self.__class__.__name__
        Adapter.__init__(self,
                         'yeelight-adapter',
                         'yeelight-adapter',
                         verbose=verbose)

        self.pairing = False
        self.start_pairing(_TIMEOUT)

    def start_pairing(self, timeout):
        """
        Start the pairing process.

        timeout -- Timeout in seconds at which to quit pairing
        """
        if self.pairing:
            return

        self.pairing = True
        for dev in discover_bulbs():
            if not self.pairing:
                break

            _id = 'yeelight-' + dev['capabilities']['id']
            if _id not in self.devices:
                device = YeelightDevice(self, _id, dev)
                self.handle_device_added(device)

        self.pairing = False

    def cancel_pairing(self):
        """Cancel the pairing process."""
        self.pairing = False
