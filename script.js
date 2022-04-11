// chrome.storage.sync.get(['wabbit'], function(items) {
//   if (items.wabbit){
//     wabbit = JSON.parse(items.wabbit);

//   }
// });

const readLocalStorage = async (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['wabbit'], function (result) {
      if (result['wabbit'] === undefined) {
        resolve({
          "user_history": []
        })
      } else {
        const wabbit = JSON.parse(result['wabbit'])
        resolve(wabbit);
      }
    });
  });
};

async function fetchData() {
  // var curr_page = "https://wiki"
  // chrome.storage.sync.get(['wabbit'], function(items) {
  //   if (items.wabbit){
  //     wabbit = JSON.parse(items.wabbit)["user_history"];
  //     user_history.push(curr_page);
  //     wabbit["user_history"] = user_history
  //     chrome.storage.sync.set({'wabbit': JSON.stringify(wabbit)});
  //   }
  //   else {
  //     wabbit.user_history.push(curr_page)
  //     chrome.storage.sync.set({'wabbit': JSON.stringify(wabbit)});
  //   }
  // });


  const wabbit = await readLocalStorage()
  let trunc_user_history = wabbit["user_history"]
  trunc_user_history = trunc_user_history.slice(Math.max(trunc_user_history.length - 5, 0))
  console.log(trunc_user_history)
  var send_data = {
    "user_history": trunc_user_history,
    "numResults": 5
  }

  const data = await fetch("http://127.0.0.1:5000/rankedResults", {
  method: 'POST', // *GET, POST, PUT, DELETE, etc.
  mode: 'cors', // no-cors, *cors, same-origin
  // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
  // credentials: 'same-origin', // include, *same-origin, omit
  headers: {
      'Content-Type': 'application/json'
  },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(send_data) // body data type must match "Content-Type" header
  });
 
  const ranked_recs = await data.json()
  //d = data.json()
  document.getElementById("loading").style.display = 'none'
  suggestions = document.getElementById("suggestions")
  console.log(ranked_recs["results"])
  for(suggestion of ranked_recs["results"]){
      var p = document.createElement('div');
      p.setAttribute("class", "suggestion_div");
      p.innerHTML = '<a class="suggestion" href='+suggestion["link"]+' target="_blank">'+suggestion["name"]+'</a>';
      suggestions.appendChild(p);
  }

  histSuggestions = document.getElementById("histSuggestions")
  console.log(trunc_user_history)
  for(suggestion of trunc_user_history){
      var p = document.createElement('div');
      p.setAttribute("class", "suggestion_div");
      title_unform = suggestion.substring(30)
      title = title_unform.replaceAll("_", " ")
      p.innerHTML = '<a class="suggestion" href='+suggestion+' target="_blank">'+title+'</a>';
      histSuggestions.appendChild(p);
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
