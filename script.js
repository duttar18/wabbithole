async function fetchData() {
    user_history = {
        "user_history": [
            "https://en.wikipedia.org/wiki/Hamilton–Jacobi–Bellman_equation",
            "https://en.wikipedia.org/wiki/Value_function",
            "https://en.wikipedia.org/wiki/Optimal_control"
        ],
        "numResults": 5
      }
    const data = await fetch("http://127.0.0.1:5000/rankedResults", {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'no-cors', // no-cors, *cors, same-origin
    // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    // credentials: 'same-origin', // include, *same-origin, omit
    headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(user_history) // body data type must match "Content-Type" header
    });
    d = data.json()
    suggestions = document.getElementById("suggestions")
    for(suggestion of d["results"]){
        var p = document.createElement('div');
        p.innerHTML = '<a class="suggestion" href='+suggestion["link"]+' target="_blank">'+suggestion["name"]+'</a>';
        suggestions.appendChild(p);
    }
}
var get = function (key) {
  return window.localStorage ? window.localStorage[key] : null;
}
var put = function (key, value) {
  if (window.localStorage) {
    window.localStorage[key] = value;
  }
}

function toggleUserHistory(item){
    if(item.className == "buttonOn") {
        item.className="buttonOff";
    } else {
        item.className="buttonOn";
    }
}

fetchData();
document.getElementById("userHistoryButton").addEventListener("click", toggleUserHistory);
