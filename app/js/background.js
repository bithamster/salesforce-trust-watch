/*globals chrome*/
/*global moment*/

chrome.runtime.onInstalled.addListener(initBackground);
chrome.runtime.onStartup.addListener(initBackground);

//-------------------------------------------------
// Initialize chrome storage as default values, and init/reset
//-------------------------------------------------
function initBackground() {
    // Check config, init sequences
    chrome.storage.local.get(null, function(items) {

        // Get local strage, if undefined, Set default values
        let myLocation = items.myLocation || 'APAC';
        let instanceKeys = items.instanceKeys || ['AP0', 'CS5'];
        let intervalMin = items.intervalMin || '60';

        // Restore(Init) Configs
        chrome.storage.local.set({
            'myLocation': myLocation,
            'instanceKeys': instanceKeys,
            'intervalMin': intervalMin,
        }, function() {

            // Init Instance List
            updateInstances();

            // Init Trust Data
            updateTrust();

            // Setup New-Timer
            resetUpdateTrustTimer();
        });
    });
}

//-------------------------------------------------
// Reset Update Timer to Next interval
//-------------------------------------------------
function resetUpdateTrustTimer() {
    chrome.storage.local.get(null, function(items) {

        //clear old timer
        chrome.alarms.clear('updateTrustTimer');

        //setup new timer
        chrome.alarms.create('updateTrustTimer', {
            periodInMinutes: Number(items.intervalMin)
        });
    });
}

//-------------------------------------------------
// Update Trust-Status when timer ends
//-------------------------------------------------
chrome.alarms.onAlarm.addListener(function(alarm) {
    switch (alarm.name) {

        case 'updateTrustTimer':
            updateTrust();
            break;
    }
});

//-------------------------------------------------
// Message Receiver
//-------------------------------------------------
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    switch (message.action) {

        case 'updateInstances':
            updateInstances();
            break;

        case 'updateTrust':
            updateTrust();
            break;

        case 'resetUpdateTrustTimer':
            resetUpdateTrustTimer();
            break;
    }
    return true;
});

//-------------------------------------------------
// Retrieve Instance-List by API
//-------------------------------------------------
function updateInstances() {

    //Salesforce Trust APIs - Status.
    let instancesAPI = "https://api.status.salesforce.com/v1/instances";
    let xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {

                //parse JSON
                let data = JSON.parse(xmlhttp.responseText);

                //sort JSON data
                data.sort((a, b) => {
                    //1st-sort: location
                    if (a.location < b.location) return -1;
                    if (a.location > b.location) return 1;
                    //2nd-sort: instanceKey
                    let aNo = (a.key.replace(/[A-Z]+/, '0')).slice(-2);
                    let bNo = (b.key.replace(/[A-Z]+/, '0')).slice(-2);
                    // console.log(aNo +' '+ a.key);
                    if (aNo < bNo) return -1;
                    if (aNo > bNo) return 1;
                    return 0;
                });

                //update JSON data on strage.local
                chrome.storage.local.set({
                    'instances': data
                });
            } else {};
        };
    };
    xmlhttp.open('GET', instancesAPI);
    xmlhttp.send();
}

//-------------------------------------------------
// Retrieve Instance-Status by API
//-------------------------------------------------
function updateTrust() {
    // Set Icon CHECKING...
    updateIcon('CHECKING');

    // Salesforce Trust APIs - Status
    let statusAPI = "https://api.status.salesforce.com/v1/instances/status/preview";
    let xmlhttp = new XMLHttpRequest();

    chrome.storage.local.get(null, function(items) {
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {

                    // Parse JSON
                    let data = JSON.parse(xmlhttp.responseText);

                    // Set UpdatedTime
                    let locale = window.navigator.userLanguage || window.navigator.language;
                    let updatedTime = moment().locale(locale).format('YYYY-MM-DD HH:mm:ss');

                    // Loop by item.instanceKeys
                    let trust = {};
                    items.instanceKeys.forEach(function(instanceKey) {
                        // Loop by data.instance
                        data.forEach(function(instance) {
                            // Store selected instance data
                            if (instance.key == instanceKey) {
                                trust[instanceKey] = instance;
                            }
                        });
                    });

                    // Update JSON data on strage.local, then Render main.html
                    chrome.storage.local.set({
                        'updatedTime': updatedTime,
                        'trust': trust,
                    }, function() {
                        chrome.runtime.sendMessage({
                            action: "renderStatus",
                        });

                        // Update Icon
                        let mainInstance = items.instanceKeys[0];
                        updateIcon(trust[mainInstance].status);
                    });
                }
            } else {}
        }
    });
    xmlhttp.open("GET", statusAPI);
    xmlhttp.send();
}

//-------------------------------------------------
// Change Extention-Icon based on status
//-------------------------------------------------
function updateIcon(status) {
    let iconPath = "app/images/icons/healthy_19.png";
    switch (status) {
        case 'CHECKING':
            iconPath = "app/images/icons/checking_19.png";
            break;
        case 'OK':
            iconPath = "app/images/icons/healthy_19.png";
            break;
        case 'MAJOR_INCIDENT_CORE':
            iconPath = "app/images/icons/disruption_19.png";
            break;
        case 'MINOR_INCIDENT_CORE':
            iconPath = "app/images/icons/degradation_19.png";
            break;
        case 'MAINTENANCE_CORE':
            iconPath = "app/images/icons/maintenance_19.png";
            break;
        case 'INFORMATIONAL_CORE':
            iconPath = "app/images/icons/information_19.png";
            break;
        case 'MAJOR_INCIDENT_NONCORE':
            iconPath = "app/images/icons/healthy_disruption_19.png";
            break;
        case 'MINOR_INCIDENT_NONCORE':
            iconPath = "app/images/icons/healthy_degradation_19.png";
            break;
        case 'MAINTENANCE_NONCORE':
            iconPath = "app/images/icons/healthy_maintenance_19.png";
            break;
        case 'INFORMATIONAL_NONCORE':
            iconPath = "app/images/icons/healthy_19.png";
            break;
    }

    chrome.browserAction.setIcon({
        path: iconPath
    });
}
