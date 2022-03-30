#!/usr/bin/env python
# encoding: utf-8
import requests
import numpy as np
class Cache:
    def __init__(self, fetch_fn):
        self.dict = dict()
        self.fetch_fn = fetch_fn

    def __call__(self, key, args):
        if key in self.dict:
            return self.dict[key]
        result = self.fetch_fn(args)
        self.dict[key] = result
        return result
    
    def __contains__(self, key):
        return key in self.dict

def linkcount_fetch(wiki_page):
    # this is so damn slow
    link = f"https://linkcount.toolforge.org/api/?page={wiki_page}&project=en.wikipedia.org"
    r = requests.get(link).json()
    return np.log(r["wikilinks"]["all"] + 1)