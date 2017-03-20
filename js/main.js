/*global chrome*/
/*global moment*/

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    chrome.storage.local.get(null, function(items) {
        switch (message.action) {

            case 'renderStatus':
                renderStatus();
                break;
        }
        return true;
    });
});

function updateTrust() {

    //disable button
    document.getElementById('updateTrust').disabled = true;

    //call updateTrust
    chrome.runtime.sendMessage({
        action: 'updateTrust'
    });
}

function openTrustPage() {
    chrome.storage.local.get(null, function(items) {
        chrome.tabs.create({
            'url': 'https://status.salesforce.com/status/' + items.instanceKey
        });
    });
}

function renderStatus() {
    chrome.storage.local.get(null, function(items) {

        //get stored data
        let data = items.trust;
        let updatedTime = items.updatedTime;

        //render Current Status
        document.getElementById('instance').innerHTML = data.key;
        document.getElementById('location').innerHTML = data.location;
        document.getElementById('status').innerHTML = data.status;
        document.getElementById('releaseVersion').innerHTML = data.releaseVersion;
        document.getElementById('updatedTime').innerHTML = updatedTime;
        document.getElementById('updateTrust').disabled = false;

        //debug
        //document.getElementById('debug').innerHTML = data;
    });
}

window.addEventListener('load', function() {

    //setup events
    document.getElementById('updateTrust').addEventListener('click', updateTrust, false);
    document.getElementById('detailedLink').addEventListener('click', openTrustPage, false);

    //render
    renderStatus();

}, false);
