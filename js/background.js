/*globals chrome*/

chrome.runtime.onInstalled.addListener(initBackground);
chrome.runtime.onStartup.addListener(initBackground);

function initBackground() {

     //restore settings (checkingInterval)
     chrome.storage.sync.get(null, function(items) {

          //set default when no-value
          let intervalMin = items.intervalMin || '60';
          alert(intervalMin);

          //create alerm timer
          chrome.alarms.create('CheckingInterval', {
               periodInMinutes: Number(intervalMin)
          });
     });
}

chrome.alarms.onAlarm.addListener(function(alarm) {
     if (alarm.name == 'CheckingInterval') {
          chrome.runtime.sendMessage({
               checkNow: "checkNow"
          });
     }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

     //reset Interval
     if (message.resetInterval) {
          chrome.alarms.clear('CheckingInterval');
          chrome.alarms.create('CheckingInterval', {
               periodInMinutes: Number(message.resetInterval)
          });
     }
});
