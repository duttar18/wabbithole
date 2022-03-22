async function fetchData() {
    data = {
        "suggestions" : [
            {
                "name": "whale",
                "link": "https://en.wikipedia.org/wiki/Whale"
            },
            {
                "name": "rabbit",
                "link": "https://en.wikipedia.org/wiki/Rabbit"
            },
            {
                "name": "zebra",
                "link": "https://en.wikipedia.org/wiki/Zebra"
            }
        ]
    }
    suggestions = document.getElementById("suggestions")
    for(suggestion of data["suggestions"]){
        var p = document.createElement('div');
        p.innerHTML = '<a class="suggestion" href='+suggestion["link"]+'>'+suggestion["name"]+'</a>';
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
