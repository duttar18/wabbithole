import requests
import urllib
import numpy as np
import math
from bs4 import BeautifulSoup
from collections import Counter
import nltk
import string
#nltk.download()

def nltk_pipeline(words, stop_words, ngram_size=1):
    tokens = nltk.tokenize.word_tokenize(words)
    tokens = [w.lower() for w in tokens]
    table = str.maketrans('', '', string.punctuation)
    stripped = [w.translate(table) for w in tokens]
    words = [word for word in stripped if word.isalpha()]
    # print(stop_words.type)
    words = [w for w in words if not (w in stop_words)]
    words = nltk.ngrams(words, ngram_size)
    return Counter(words)

def wiki_prefix(suffix):
    # suffix is '/wiki/<article title>'
    return "https://en.wikipedia.org/"+suffix

def wiki_title_from_link(wiki_link):
    # wiki_link format: "https://en.wikipedia.org/wiki/Hamilton–Jacobi–Bellman_equation"
    title_unform = wiki_link[30:]
    title = title_unform.replace("_"," ")
    return title

def wiki_link_from_title(wiki_title, link_base="https://en.wikipedia.org/wiki/"):
    # wiki title format: "Hamilton-Jacobi-Bellman equation"
    title_underscore = wiki_title.replace(" ", "_")
    link = link_base + title_underscore
    return link

def parse_wiki_api(link, stop_words, get_text=False):
    link = urllib.parse.unquote(link)
    S = requests.Session()

    URL = "https://en.wikipedia.org/w/api.php"

    PARAMS = {
        "action": "parse",
        "format": "json",
        "prop": "links|properties",
        "redirects": ""
    }
    PARAMS["page"] = link
    if get_text:
        PARAMS["prop"] += "|wikitext"

    R = S.get(url=URL, params=PARAMS)
    DATA = R.json()

    if "parse" not in DATA.keys():
        return None
    parse_links = DATA["parse"]["links"]
    pageid = DATA["parse"]["pageid"]
    redirect_list = DATA["parse"]["redirects"]
    if len(redirect_list) > 0:
        redirect = redirect_list[0]['to']
    else:
        redirect = None
    links = []

    blocklist = [
        "Main_Page",
        "Help:",
        "Special:",
        "Portal:",
        "Talk:",
        "Template:",
        "Template talk:",
        "User talk:",
        "Wikipedia:",
        "File:",
        "Category:"
    ]

    for l in parse_links:
        #if l['*'].
        if any(bad_prefix in l['*'] for bad_prefix in blocklist):
            continue
        links.append(l['*'])

    if get_text:
        words = DATA["parse"]["wikitext"]["*"]
        words = nltk_pipeline(words, stop_words)
        return links, pageid, redirect, words
    return links, pageid, redirect

def score_link_similarity(user_history, target):
    # user_history  
    #   incorporate idf (just hyperlinks) -> scrape target/what_links_here (expensive)
    #   or sample 10000 pages and count link frequency and store it somewhere else                       
    #   incorporate ingoing recommendations
    # return score(target | user_history)

    # how many times does target appear in self.outgoing_links
    z_score = (user_history.outgoing_links[target]-user_history.mean)/user_history.std
    return .5 * (math.erf(z_score / 2 ** .5) + 1)

def score_link_text_similarity(user_history, target, stop_words):
    # user_history  
    #   incorporate idf (text)
    #   incorporate ingoing recommendations
    # return score(target | user_history)

    # references in div class = reflist
    target = nltk_pipeline(target,stop_words)
    words = user_history.words
    total = 0
    for term in target:
        total += words[term]
    return total

def score_coupling_similarity(user_history, target, cache, doc_freq_cache, stop_words):
    # user_history  
    #   need to download target and scrape it's links
    # pages are similar if their outgoing (ingoing) links have overlap
    if target in cache:
        results = cache[target]
    else:
        results = parse_wiki_api(target, stop_words, get_text=False)
        # TODO swap to MediaWiki API
        cache[target] = results
    if results is None:
        # likely that this link doesn't exist
        return None
        
    links, pageid, redirect = results
    if redirect is not None:
        print(target, redirect)
    if redirect is not None and redirect in user_history.already_visited_pages:
        # don't recommend this page, a redirected variant was in the user history
        # (only way to resolve redirects from outgoing-links is through this api call)
        return None

    # TODO: implement faster doc freq
    #doc_freq = doc_freq_cache()
    target_outgoing = Counter(links)

    score = 0
    doc_len = sum(v for v in user_history.outgoing_links.values())

    # BM25 hyperparameters that are untuned
    k1 = 0.5
    k3 = 0.99
    b = 0.9
    avg_doc_len = 50 # estimate?
    for link, count in target_outgoing.items():
        query_count = user_history.outgoing_links[link]

        if count == 0 or query_count == 0:
            continue
        #page_name = link.split("/wiki/")[1]
        doc_freq = 0.001 if link not in doc_freq_cache else doc_freq_cache(link, link)
        
        norm_qtf = (k3+1)*query_count / (k3 + query_count)
        norm_tf = count * (k1 + 1) / (count + k1*((1-b)+b*(doc_len/avg_doc_len)))
        tf = norm_tf * norm_qtf

        #num_links_on_wiki = 10e7
        log_num_links_on_wiki = 6 * np.log(10)
        idf = log_num_links_on_wiki - doc_freq
        score += tf * idf
    # union = sum(v for v in target_outgoing.values()) + sum(v for v in user_history.outgoing_links.values())
    # adjust score to favor links with more content
    score += 0.1 * sum(v for v in target_outgoing.values())
    return score

def compute_outgoing_scores_baseline(user_history, stop_words):
    # composite score_link_similarity and score_link_text_similarity
    # (todo: this filters scores, will do re-ranking with coupling similarity, re-ranking with deeper searches, etc)
    weight = 0.05 # to be tuned
    outgoing_scores = dict()
    for link in user_history.rec_links:
        link_sim = score_link_similarity(user_history, link)
        text_sim = score_link_text_similarity(user_history, link, stop_words)
        outgoing_scores[link] = link_sim + weight * text_sim
        #print(link_sim, weight*text_sim, link)
    return outgoing_scores

def rerank_with_coupling(user_history, baseline_scores, num_rerank, cache, doc_freq_cache, stop_words):
    new_rankings = {k:v for k, v in baseline_scores}
    for target, score in baseline_scores[:num_rerank]:
        new_score = score_coupling_similarity(user_history, target, cache, doc_freq_cache, stop_words)
        if new_score is None:
            continue
        #print(new_score * 0.1, score, target)
        new_rankings[target] = new_score*0.1 + score
    return new_rankings