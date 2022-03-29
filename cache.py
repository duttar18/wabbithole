#!/usr/bin/env python
# encoding: utf-8

def linkcount_fetch(wiki_page):
    # this is so damn slow
    link = f"https://linkcount.toolforge.org/api/?page={wiki_page}&project=en.wikipedia.org"
    r = requests.get(link).json()
    return r["wikilinks"]["all"]

class Cache:
    def __init__(self, fetch_fn=linkcount_fetch):
        self.dict = dict()
        self.fetch_fn = fetch_fn

    def __call__(self, key, args):
        if key in self.dict:
            return self.dict[key]
        result = self.fetch_fn(args)
        self.dict[key] = result
        return result
