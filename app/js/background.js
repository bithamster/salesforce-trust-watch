/*globals chrome*/
/*global moment*/

chrome.runtime.onInstalled.addListener(initBackground);
chrome.runtime.onStartup.addListener(initBackground);

function initBackground() {

    //check config, init sequences
    chrome.storage.local.get(null, function(items) {

        //get local as first, if undefined. set default values
        let instanceKey = items.instanceKey || 'AP0';
        let intervalMin = items.intervalMin || '60';

        //init(re-set) configs
        chrome.storage.local.set({
            'instanceKey': instanceKey,
            'intervalMin': intervalMin
        }, function() {

            //init Instance List
            updateInstances();

            //init Trust Data
            updateTrust();

            //setup new timer
            resetUpdateTrustTimer();
        });
    });
}

chrome.alarms.onAlarm.addListener(function(alarm) {
    switch (alarm.name) {

        case 'updateTrustTimer':
            updateTrust();
            break;
    }
});

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

function updateInstances() {

    //Salesforce Trust APIs - Status.
    let statusAPI = 'https://api.status.salesforce.com/v1/instances';
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
            }
            else {}
        }

    };
    xmlhttp.open('GET', statusAPI);
    xmlhttp.send();
}

function updateTrust() {
    chrome.storage.local.get(null, function(items) {

        //set Icon checking...
        updateIcon('CHECKING');

        //Salesforce Trust APIs - Status
        let statusAPI = 'https://api.status.salesforce.com/v1/instances/' + items.instanceKey + '/status';
        let xmlhttp = new XMLHttpRequest();

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {

                    //parse JSON
                    let data = JSON.parse(xmlhttp.responseText);
                    let locale = window.navigator.userLanguage || window.navigator.language;
                    let updatedTime = moment().locale(locale).format('YYYY-MM-DD HH:mm:ss');

                    //update JSON data on strage.local
                    chrome.storage.local.set({
                        'trust': data,
                        'updatedTime': updatedTime
                    });

                    //update Icon
                    updateIcon(data.status);

                    //render Status
                    chrome.runtime.sendMessage({
                        action: 'renderStatus'
                    });
                }
                else {}
            }
        };
        xmlhttp.open('GET', statusAPI);
        xmlhttp.send();
    });
}

function updateIcon(status) {

    switch (status) {
        case 'CHECKING':
            chrome.browserAction.setIcon({
                path: "../images/icons/checking_19.png"
            });
            break;
        case 'OK':
            chrome.browserAction.setIcon({
                path: "../images/icons/healthy_19.png"
            });
            break;
        case 'MAJOR_INCIDENT_CORE':
            chrome.browserAction.setIcon({
                path: "../images/icons/disruption_19.png"
            });
            break;
        case 'MINOR_INCIDENT_CORE':
            chrome.browserAction.setIcon({
                path: "../images/icons/degradation_19.png"
            });
            break;
        case 'MAINTENANCE_CORE':
            chrome.browserAction.setIcon({
                path: "../images/icons/maintenance_19.png"
            });
            break;
        case 'INFORMATIONAL_CORE':
            chrome.browserAction.setIcon({
                path: "../images/icons/information_19.png"
            });
            break;
        case 'MAJOR_INCIDENT_NONCORE':
            chrome.browserAction.setIcon({
                path: "../images/icons/healthy_disruption_19.png"
            });
            break;
        case 'MINOR_INCIDENT_NONCORE':
            chrome.browserAction.setIcon({
                path: "../images/icons/healthy_degradation_19.png"
            });
            break;
        case 'MAINTENANCE_NONCORE':
            chrome.browserAction.setIcon({
                path: "../images/icons/healthy_maintenance_19.png"
            });
            break;
        case 'INFORMATIONAL_NONCORE':
            chrome.browserAction.setIcon({
                path: "../images/icons/healthy_information_19.png"
            });
            break;
        default:
            chrome.browserAction.setIcon({
                path: "../images/icons/healthy_19.png"
            });
            break;
    }
}
