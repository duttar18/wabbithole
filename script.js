function removeDuplicates(arr) {
  return arr.filter((item, 
      index) => arr.indexOf(item) === index);
}

const readLocalStorage = async (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['wabbit'], function (result) {
      if (result['wabbit'] === undefined) {
        resolve({
          "user_history": [],
          "user_history_setting": false,
          "timestamps": []
        })
      } else {
        const wabbit = JSON.parse(result['wabbit'])
        resolve(wabbit);
      }
    });
  });
};

async function getHistory() {
  const wabbit = await readLocalStorage()
  histSuggestions = document.getElementById("histSuggestions")
  var timestamps = wabbit["timestamps"]
  console.log(timestamps)
  console.log("AHAHAHH")
  
  histSuggestions = document.getElementById("histSuggestions")
  while (histSuggestions.firstChild) {
    histSuggestions.removeChild(histSuggestions.firstChild)
  }
  var createNewGroupButton = document.createElement('button');
  createNewGroupButton.classList.add("createNewGroup");
  createNewGroupButton.innerHTML = "Embark on a new journey"
  histSuggestions.appendChild(createNewGroupButton)
  createNewGroupButton.addEventListener("click", async function() {
    var wabbit = await readLocalStorage()
    var timestamps = wabbit.timestamps 
    if (timestamps.length > 0 & timestamps[timestamps.length -1].length > 0) {
      timestamps.push([])
      wabbit.timestamps= timestamps
      chrome.storage.local.set({'wabbit': JSON.stringify(wabbit)})
      await getHistory()
      // await fetchData()
    }
  });

  var first_button = true;
  for(group of timestamps.reverse()){
      if (group == null) {
        continue;
      }
      var p = document.createElement('div');
      p.setAttribute("class", "groupCard");
      var button_history = []
      for(i of group){
        button_history.push(i[1])
      }
      button_history = removeDuplicates(button_history)
      if (first_button) {
        var b = document.createElement('div')
        b.id = button_history.join(" ")
        var setAsHistoryDiv = document.createElement('div');
        setAsHistoryDiv.setAttribute("class", "currentJourney")
        setAsHistoryDiv.innerHTML = "Current journey"
        b.appendChild(setAsHistoryDiv)
        first_button = false;
      } 
      else {
        var b = document.createElement('button');
        b.id = button_history.join(" ")
        var setAsHistoryDiv = document.createElement('div');
        setAsHistoryDiv.setAttribute("class", "groupCardButton")
        setAsHistoryDiv.innerHTML = "Set as current journey"
        b.appendChild(setAsHistoryDiv);
        b.classList.add("setHistButton");
        b.addEventListener("click", async function() {
          var button_wabbit = await readLocalStorage()
          var timestamps = button_wabbit.timestamps 
          // user_history = user_history.concat(button_history)
          button_history = this.id.split(" ")
          new_group = button_history.map(wikiLink =>
            [0, wikiLink, new Date()]
          )
          timestamps.push(new_group)
          button_wabbit.timestamps = timestamps
          chrome.storage.local.set({'wabbit': JSON.stringify(button_wabbit)})
          var loading = document.getElementById("loading")
          loading.style.display = ''
          suggestions = document.getElementById("suggestions")
          while (suggestions.firstChild) {
            suggestions.removeChild(suggestions.firstChild)
          }
          await getHistory()
          await fetchData()
        });
      }

      for(link of button_history.reverse()){
        var o = document.createElement('div');
        o.setAttribute("class", "link");
        title_unform = link.substring(30)
        title = title_unform.replaceAll("_", " ")
        title = title.split("#")[0]
        title = decodeURIComponent(title)
        o.innerHTML = '<a class="suggestion" href='+link+' target="_blank">'+title+'</a>';
        p.appendChild(o);
      }
      
      p.appendChild(b)
      histSuggestions.appendChild(p)
  }
}

async function toggleUserHistorySetting() {
  const wabbit = await readLocalStorage()
  wabbit["user_history_setting"] = !wabbit["user_history_setting"]
  chrome.storage.local.set({'wabbit': JSON.stringify(wabbit)});
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
  //let user_history = wabbit["user_history"]
  var groups = wabbit["timestamps"]
  groups = groups.filter(function(curElement) {
    return curElement !== null
  })
  var user_history2 = groups[groups.length - 1]
  var user_history = user_history2.map(function(curElement) {
    return curElement[1];
  })
  //let trunc_user_history = user_history.slice(Math.max(user_history.length - 5, 0))
  
  var send_data = {
    "user_history": user_history,
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
  //var settings_content = document.getElementById("settings")
  //var settings_button = document.getElementById("settingsButton")
  
  if (content.style.display === "block") {
    content.style.display = "none";
  } else {
    content.style.display = "block";
    /*settings_content.style.display = "none"
    if (settings_button.classList.contains("active")) {
      settings_button.classList.toggle("active")
    }*/
  }
});


var settings_button = document.getElementById("settingsButton")

/*
settings_button.addEventListener('click', function() {
  
  this.classList.toggle("active");
  
  var content = document.getElementById("settings");
  var hist_content = document.getElementById("histSuggestions")
  var hist_button = document.getElementById("histButton")

  if (content.style.display === "block") {
    content.style.display = "none";
  } else {
    content.style.display = "block";
    hist_content.style.display = "none"
    if (hist_button.classList.contains("active")) {
      hist_button.classList.toggle("active")
    }
  }

});
*/
getHistory();
fetchData();
//document.getElementById("userHistoryButton").addEventListener("click", toggleUserHistory);

