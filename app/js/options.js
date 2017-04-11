/*global chrome*/

function saveSetting() {

    //get values to memory
    let instanceKey = document.getElementById('instanceList').value;
    let intervalMin = document.getElementById('interval').value;

    //save settings to strage.sync
    chrome.storage.local.set({
        'instanceKey': instanceKey,
        'intervalMin': intervalMin
    }, function() {

        //updateTrust
        chrome.runtime.sendMessage({
            action: 'updateTrust'
        });

        //resetUpdateTrustTimer
        chrome.runtime.sendMessage({
            action: 'resetUpdateTrustTimer'
        });
    });

    //savedTime at a glance
    let locale = window.navigator.userLanguage || window.navigator.language;
    document.getElementById('savedMessage').innerHTML = 'Options saved.';
    window.setTimeout(function() {
        document.getElementById('savedMessage').innerHTML = '';
    }, 3000);
}

function renderInstanceList() {
    chrome.storage.local.get(null, function(items) {

        //get stored JSON data
        let data = items.instances;
        let instanceKey = items.instanceKey;
        let intervalMin = items.intervalMin;

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
        document.getElementById('instanceList').value = instanceKey;
        document.getElementById('checkingInterval').value = intervalMin;
    });
}

window.addEventListener('load', function() {

    //setup events
    document.getElementById('instanceList').addEventListener('change', saveSetting, false);
    document.getElementById('interval').addEventListener('change', saveSetting, false);

    //render
    renderInstanceList();

}, false);
