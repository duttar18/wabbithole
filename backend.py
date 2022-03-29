from user_history import UserHistory
from helper import rerank_with_coupling
from helper import compute_outgoing_scores_baseline
from helper import wiki_title_from_link
from helper import wiki_link_from_title
# from cache import Cache

import json
from flask import Flask
from flask import request
app = Flask(__name__)

import nltk
from nltk.corpus import stopwords

stop_words = set(stopwords.words("english"))

cache = {}
doc_freq_cache = None

@app.route('/rankedResults')
def index():
    print("called ranked results")
    data = request.get_json()
    uh = [wiki_title_from_link(link) for link in data["user_history"]]
    user_history = UserHistory(uh,stop_words)
    baseline_scores = compute_outgoing_scores_baseline(user_history,stop_words)
    sorted_baseline_scores = [(k, v) for k, v in sorted(baseline_scores.items(), reverse=True, key=lambda item: item[1])]
    final_results = rerank_with_coupling(
        user_history, 
        sorted_baseline_scores, 
        data["numResults"],
        cache, 
        doc_freq_cache,
        stop_words)
    sorted_final_results = [k for k, v in sorted(final_results.items(), reverse=True, key=lambda item: item[1])]
    sorted_final_results = [wiki_link_from_title(wiki_title) for wiki_title in sorted_final_results[:data["numResults"]]]
    return json.dumps({
        'results': sorted_final_results,
    })
app.run(debug=True)