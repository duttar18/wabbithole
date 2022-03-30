from user_history import UserHistory
from helper import rerank_with_coupling
from helper import compute_outgoing_scores_baseline
from helper import wiki_title_from_link
from helper import wiki_link_from_title
from cache import Cache, linkcount_fetch

import json
import flask
from flask import Flask
from flask import request
from flask_cors import CORS, cross_origin

import nltk
from nltk.corpus import stopwords

app = Flask(__name__)
CORS(app)

stop_words = set(stopwords.words("english"))

cache = {}
doc_freq_cache = Cache(linkcount_fetch)
doc_freq_cache("Doi (identifier)", "Doi (identifier)")
doc_freq_cache("ISBN (identifier)", "ISBN (identifier)")
doc_freq_cache("ISSN (identifier)", "ISSN (identifier)")
doc_freq_cache("JSTOR (identifier)", "JSTOR (identifier)")
doc_freq_cache("Bibcode (identifier)", "Bibcode (identifier)")
doc_freq_cache("Hdl (identifier)", "Hdl (identifier)")
doc_freq_cache("PMC (identifier)", "PMC (identifier)")
doc_freq_cache("PMID (identifier)", "PMID (identifier)")
doc_freq_cache("S2CID (identifier)", "S2CID (identifier)")
print("running!")

@app.route('/rankedResults', methods=['GET','POST'])
def index():
    data = request.get_json(force=True)
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
    sorted_final_results = [{"link": wiki_link_from_title(wiki_title), "name":wiki_title} for wiki_title in sorted_final_results[:data["numResults"]]]
    
    #return json.dumps(sorted_final_results)
    response = flask.jsonify({'results': sorted_final_results})
    return response

if __name__ == "__main__":
    app.run(debug=True)