import logging
import random
import threading
import requests
import ujson

from modules.Proxy import Proxy

logger = logging.getLogger()


class ProxyProvider:
    def __init__(self, min_proxies=200):
        self._bad_proxies = {}
        self._minProxies = min_proxies
        self.lock = threading.RLock()

        self.get_list()

    def get_list(self):
        logger.debug("Getting proxy list")
        r = requests.get("https://jsonblob.com/31bf2dc8-00e6-11e7-a0ba-e39b7fdbe78b", timeout=10)
        proxies = ujson.decode(r.text)
        logger.debug("Got %s proxies", len(proxies))
        self._proxies = list(map(lambda p: Proxy(p), proxies))

    def pick(self):
        with self.lock:
            self._proxies.sort(key = lambda p: p.score, reverse=True)
            proxy_len = len(self._proxies)
            max_range = 50 if proxy_len > 50 else proxy_len
            proxy = self._proxies[random.randrange(1, max_range)]
            proxy.used()

            return proxy

    def count(self):
        with self.lock:
            return len(self._proxies)

if __name__ == "__main__":
    provider = ProxyProvider()
    print(provider.pick().url)