/*global chrome*/
/*global moment*/

var instanceKey;
var intervalMin;
var locale = window.navigator.userLanguage || window.navigator.language;

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.checkNow) {
        checkTrust();
    }
    return true;
});

function checkTrust() {

    //Salesforce Trust APIs - Status
    let statusAPI = 'https://api.status.salesforce.com/v1/instances/' + instanceKey + '/status';
    let xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                let data = JSON.parse(xmlhttp.responseText);
                document.getElementById('instance').innerHTML = data.key;
                document.getElementById('status').innerHTML = data.status;
                document.getElementById('releaseVersion').innerHTML = data.releaseVersion;
                document.getElementById('updatedTime').innerHTML = moment().locale(locale).format('YYYY-MM-DD HH:mm:ss');
                //debug
                document.getElementById('debug').innerHTML = xmlhttp.responseText;
            }
            else {}
        }
    };
    xmlhttp.open('GET', statusAPI);
    xmlhttp.send();
}

function setInstanceList() {

    //Salesforce Trust APIs - Status.
    var statusAPI = 'https://api.status.salesforce.com/v1/instances';
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                var data = JSON.parse(xmlhttp.responseText);

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

                //create 'Instance Key' option
                Object.keys(data).forEach(function(key) {

                    let region = data[key].location;
                    let instance = data[key].key;
                    let environment = data[key].environment;

                    //only create optgroup once
                    var regionOPTG = document.getElementById('region_' + region);
                    if (regionOPTG === null) {
                        regionOPTG = document.createElement('optgroup');
                        regionOPTG.setAttribute('label', region);
                        regionOPTG.setAttribute('id', 'region_' + region);
                        var insList = document.getElementById('instanceList');
                        insList.appendChild(regionOPTG);
                    }

                    //production only
                    if (environment === 'production') {
                        let instanceOP = document.createElement('option');
                        instanceOP.setAttribute('label', instance);
                        instanceOP.setAttribute('value', instance);
                        regionOPTG.appendChild(instanceOP);
                    }
                });

                //restore pre-Selected values
                chrome.storage.sync.get(null, function(items) {
                    document.getElementById('instanceList').value = items.instanceKey;
                    document.getElementById('checkingInterval').value = items.intervalMin;
                });
            }
            else {}
        }

    };
    xmlhttp.open('GET', statusAPI);
    xmlhttp.send();
}

function saveSetting() {

    //get values to memory
    instanceKey = document.getElementById('instanceList').value;
    intervalMin = document.getElementById('checkingInterval').value;

    //save settings to strage
    chrome.storage.sync.set({
        'instanceKey': instanceKey,
        'intervalMin': intervalMin
    });

    //reset Interval
    chrome.runtime.sendMessage({
        resetInterval: intervalMin
    });

    //savedTime at a glance
    document.getElementById('savedTime').innerHTML = 'saved at ' + moment().locale(locale).format('YYYY-MM-DD HH:mm:ss');
    window.setTimeout(function() {
        document.getElementById('savedTime').innerHTML = '';
    }, 10000);
}

window.addEventListener('load', function() {

    //Setup InstanceList
    setInstanceList();

    //Setup Buttons
    document.getElementById('checkNow').addEventListener('click', checkTrust, false);
    document.getElementById('saveSettings').addEventListener('click', saveSetting, false);

    //checkNow
    checkTrust();

}, false);
