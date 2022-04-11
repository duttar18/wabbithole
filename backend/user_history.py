#!/usr/bin/env python
# encoding: utf-8

import urllib
import numpy as np
import math
from bs4 import BeautifulSoup
from collections import Counter
import string
import nltk

from helper import parse_wiki_api


class UserHistory:
    def __init__(self, user_history,stop_words):
        self.user_history = user_history
        self.already_visited_pages = set() # resolves redirects in user_history

        # user_vists is a list of links in chronological order ascending
        # user_vists[-1] is the current page
        self.outgoing_links = Counter()
        #self.ingoing_links = set()
        
        self.words = Counter()
        for link in set(user_history):
            link = urllib.parse.unquote(link)
            out_links, pageid, redirect, words = parse_wiki_api(link, stop_words, get_text=True)
            if redirect is not None:
                self.already_visited_pages.add(redirect)
            else:
                self.already_visited_pages.add(link)

            self.words.update(words)
            self.outgoing_links.update(set(out_links))
            #self.ingoing_links.update(parse_wiki_ingoing(link))

        # remove self-loops
        for page in self.already_visited_pages:
            if page in self.outgoing_links:
                del self.outgoing_links[page]
        #self.ingoing_links -= already_visited_pages
        
        outgoing_links_list = list(self.outgoing_links.values())
        self.mean = np.average(outgoing_links_list)
        self.std = np.std(outgoing_links_list)