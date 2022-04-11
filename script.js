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
          "user_history": [],
          "user_history_setting": false,
        })
      } else {
        const wabbit = JSON.parse(result['wabbit'])
        resolve(wabbit);
      }
    });
  });
};

async function toggleUserHistorySetting() {
  console.log("Here")
  const wabbit = await readLocalStorage()
  wabbit["user_history_setting"] = !wabbit["user_history_setting"]
  chrome.storage.local.set({'wabbit': JSON.stringify(wabbit)});
  console.log(wabbit["user_history_setting"])
  if (wabbit["user_history_setting"]){
    document.getElementById("userHistoryButton").classList.add('userHistoryButtonOn');
  }
  else {
    document.getElementById("userHistoryButton").classList.remove('userHistoryButtonOn');
  }
}

async function fetchData() {
  var userHistoryButton = document.getElementById("userHistoryButton")
  if (userHistoryButton){
    userHistoryButton.addEventListener("click", toggleUserHistorySetting);
  }


  const wabbit = await readLocalStorage()
  console.log(wabbit.user_history)
  // if (!wabbit["user_history_setting"]) {
  //   wabbit["user_history"] = []
  //   console.log("user history setting turned off")
  // }
  // else{
  //   console.log("User history turned on")
  // }

  let trunc_user_history = wabbit["user_history"]
  trunc_user_history = trunc_user_history.slice(Math.max(trunc_user_history.length - 5, 0))
  
  var send_data = {
    "user_history": trunc_user_history,
    "numResults": 5
  }

  const data = await fetch("http://127.0.0.1:5000/rankedResults", {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    credentials: 'include',
    mode: 'cors', // no-cors, *cors, same-origin
    // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    // credentials: 'same-origin', // include, *same-origin, omit
    headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://127.0.0.1:5000',
    },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(send_data) // body data type must match "Content-Type" header
  });

  const ranked_recs = await data.json()
  //d = data.json()
  var loading = document.getElementById("loading")
  if (loading){
    loading.style.display = 'none'
  }
  suggestions = document.getElementById("suggestions")
  for(suggestion of ranked_recs["results"]){
      var p = document.createElement('div');
      p.setAttribute("class", "suggestion_div");
      p.innerHTML = '<a class="suggestion" href='+suggestion["link"]+' target="_blank">'+suggestion["name"]+'</a>';
      suggestions.appendChild(p);
  }

  // histSuggestions = document.getElementById("histSuggestions")
  // console.log(trunc_user_history)
  // for(suggestion of trunc_user_history.reverse()){
  //     var p = document.createElement('div');
  //     p.setAttribute("class", "suggestion_div");
  //     title_unform = suggestion.substring(30)
  //     title = title_unform.replaceAll("_", " ")
  //     title = title.split("#")[0]
  //     p.innerHTML = '<a class="suggestion" href='+suggestion+' target="_blank">'+title+'</a>';
  //     histSuggestions.appendChild(p);
  // }  
  histSuggestions = document.getElementById("histSuggestions")
  var timestamps = wabbit["timestamps"]
  for(group of timestamps.reverse()){
      var p = document.createElement('div');
      p.setAttribute("class", "groupCard");
      var b = document.createElement('button');
      b.appendChild(document.createTextNode('set as history'));
      b.classList.add("histButton");
      var button_history = []
      for(i of group){
        button_history.push(wabbit.user_history[i[0]])
      }
      b.id = button_history.join(" ")
      console.log(button_history)
      b.addEventListener("click", function() {
        var user_history = wabbit.user_history 
        // user_history = user_history.concat(button_history)
        user_history = user_history.concat(this.id.split(" "))
        wabbit.user_history=user_history
        chrome.storage.local.set({'wabbit': JSON.stringify(wabbit)})
      });
      p.appendChild(b)
      for(i of group){
        var o = document.createElement('div');
        o.setAttribute("class", "link");
        title_unform = wabbit.user_history[i[0]].substring(30)
        title = title_unform.replaceAll("_", " ")
        title = title.split("#")[0]
        o.innerHTML = '<a class="suggestion" href='+wabbit.user_history[i[0]]+' target="_blank">'+title+'</a>';
        p.appendChild(o);
      }
      histSuggestions.appendChild(p)
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

var hist_button = document.getElementById("histButton")

hist_button.addEventListener('click', function() {
  this.classList.toggle("active");
  var content = document.getElementById("histSuggestions");
  if (content.style.display === "block") {
    content.style.display = "none";
  } else {
    content.style.display = "block";
  }
});


var settings_button = document.getElementById("settingsButton")

settings_button.addEventListener('click', function() {
  this.classList.toggle("active");
  var content = document.getElementById("settings");
  if (content.style.display === "block") {
    content.style.display = "none";
  } else {
    content.style.display = "block";
  }

});

fetchData();
document.getElementById("userHistoryButton").addEventListener("click", toggleUserHistory);

