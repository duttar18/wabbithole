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
            if (last_group.length>0){
              var last = last_group[last_group.length-1]
              // if (last.getTime() > now.getTime()){
              // console.log(last)
              var l = Date.parse(last[2])
              var group_datum = [user_history.length-1, tab.url, now.toString()]
              if(Math.abs(now - l)/3600<100){
                timestamps[timestamps.length-1].push(group_datum)
              }
              else {
                timestamps.push([group_datum])
              }
            }
            else {
              var group_datum = [user_history.length-1, tab.url, now.toString()]
              timestamps[timestamps.length-1].push(group_datum)
            }
            
          }
          else {
            var now = new Date()
            timestamps = [[[user_history.length-1, tab.url, now.toString()]]]
          }
          console.log(timestamps)
          wabbit["timestamps"] = timestamps

          chrome.storage.local.set({'wabbit': JSON.stringify(wabbit)});
        }
        else {
          wabbit.user_history.push(tab.url)
          wabbit.timestamps.push([[0, tab.url, new Date()]])
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