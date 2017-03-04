class Proxy:
    def __init__(self, url):
        self._url = url
        self._score = 0
        pass

    @property
    def url(self):
        return self._url

    def used(self):
        self._score += 1

    def fatal_error(self):
        self._score -= 10

    def connection_error(self):
        self._score -= 2

    def parse_error(self):
        self._score -= 2

    @property
    def score(self):
        return self._score
