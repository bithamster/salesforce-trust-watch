/*global chrome*/
/*global moment*/

//-------------------------------------------------
// Setup Listener
//-------------------------------------------------
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    chrome.storage.local.get(null, function(items) {
        switch (message.action) {

            case "renderStatus":
                renderStatus();
                break;
        }
        return true;
    });
});

//-------------------------------------------------
// Call updateTrust@background.js
//-------------------------------------------------
function updateTrust() {

    //disable button
    document.getElementById("update-trust-button").disabled = true;

    //call updateTrustAll
    chrome.runtime.sendMessage({
        action: "updateTrust"
    });
}

//-------------------------------------------------
// Open new-Tab when "Salesforce Trust Status" link has clicked
//-------------------------------------------------
function openTrustPage(event) {
    chrome.storage.local.get(null, function(items) {
        chrome.tabs.create({
            "url": event.target.href
        });
    });
}

//-------------------------------------------------
// Render main.html
//-------------------------------------------------
function renderStatus() {
    chrome.storage.local.get(null, function(items) {

        // Loop by instanceKeys
        items.instanceKeys.forEach(function(instanceKey, index) {

            // Retrieve stored responce-data
            let instanceData = items.trust[instanceKey];

            // Render Current Status
            let environment = instanceData.environment;
            document.getElementById(environment + "-instance").innerHTML = instanceData.key;
            document.getElementById(environment + "-releaseVersion").innerHTML = instanceData.releaseVersion;
            document.getElementById(environment + "-status").innerHTML = instanceData.status;
            document.getElementById(environment + "-detailedLink").title = "https://status.salesforce.com/status/" + instanceData.key;
            document.getElementById(environment + "-detailedLink").href = "https://status.salesforce.com/status/" + instanceData.key;

            // Render icon by prefix of status-string
            let status = items.trust[instanceKey].status;

            // DEBUG
            // status = "OK";
            // status = "MINOR_INCIDENT_CORE";
            // status = "MAJOR_INCIDENT_CORE";
            // status = "MAINTENANCE_CORE"
            // status = "INFORMATIONAL_CORE"
            // status = "UNKNOWN";

            // https://status.salesforce.com/status/AP6/incidents/1620
            // https://status.salesforce.com/status/AP6/maintenances/25677

            // Substring first CAPITALs as prefix
            let statusPrefix = /^[A-Z]+/.exec(status);
            let svgdom = document.getElementById(environment + "-icon_" + statusPrefix);
            if (svgdom) {
                svgdom.classList.remove("slds-hide");
            } else {
                document.getElementById(environment + "-icon_OTHER").classList.remove("slds-hide");
            }
        });

        document.getElementById("updatedTime").innerHTML = items.updatedTime;
        document.getElementById("update-trust-button").disabled = false;
    });
}

//-------------------------------------------------
// Debug
//-------------------------------------------------
function debug(string) {
    document.getElementById("debug").innerHTML = string;
}

window.addEventListener("load", function() {

    // Setup events
    document.getElementById("update-trust-button").addEventListener("click", updateTrust, false);
    document.getElementById("production-detailedLink").addEventListener("click", openTrustPage, false);
    document.getElementById("sandbox-detailedLink").addEventListener("click", openTrustPage, false);

    // Render
    renderStatus();

}, false);
