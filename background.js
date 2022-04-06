const filter = {
    url: [
      {
        urlMatches: 'https://en.wikipedia.org/wiki/',
      },
    ],
  };

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    var wabbit = {
        "user_history": []
    }
    chrome.storage.local.get(['wabbit'], function(items) {
        // console.log("background")
        if (items.wabbit){
          var user_history = JSON.parse(items.wabbit)["user_history"];
          user_history.push(tab.url);
          wabbit["user_history"] = user_history
          chrome.storage.local.set({'wabbit': JSON.stringify(wabbit)});
        }
        else {
          wabbit.user_history.push(tab.url)
          chrome.storage.local.set({'wabbit': JSON.stringify(wabbit)});
        }
        // console.log(wabbit["user_history"])
      });
    return tab;
  }
  
chrome.webNavigation.onCompleted.addListener(() => {
    console.info("foo")
    const tab = getCurrentTab()
    //console.info(tab);
}, filter);