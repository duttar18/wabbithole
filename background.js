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
        "user_history": [],
        "timestamps": [],
    }
    console.log("HI")
    chrome.storage.local.get(['wabbit'], function(items) {
        // console.log("background")
        if (items.wabbit){
          var user_history = JSON.parse(items.wabbit)["user_history"];
          // console.log(tab)
          user_history.push(tab.url);
          wabbit["user_history"] = user_history
          
          var timestamps = JSON.parse(items.wabbit)["timestamps"];
          console.log(timestamps.length)

          if(timestamps.length>0){
            console.log("HEre")
            var now = new Date();
            var last_group = timestamps[timestamps.length-1]
            var last = last_group[last_group.length-1]
            // if (last.getTime() > now.getTime()){
            // console.log(last)
            var l = Date.parse(last[1])
            if(Math.abs(now - l)/3600<100){
              timestamps[timestamps.length-1].push([user_history.length-1,now.toString()])
            }
            else {
              timestamps.push([[user_history.length-1,now.toString()]])
            }
          }
          else {
            var now = new Date()
            timestamps = [[[user_history.length-1,now.toString()]]]
          }
          console.log(timestamps)
          wabbit["timestamps"] = timestamps

          chrome.storage.local.set({'wabbit': JSON.stringify(wabbit)});
        }
        else {
          wabbit.user_history.push(tab.url)
          wabbit.timestamps.push([[0,new Date()]])
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