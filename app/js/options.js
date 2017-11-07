/*global chrome*/

//-------------------------------------------------
// Reset UI when location has changed
//-------------------------------------------------
function locationChanged() {

    //Clear production-instance-list
    document.getElementById('production-instance-list').value = "";
    document.getElementById('production-instance-list__error').className = "";
    document.getElementById('production-instance-list__message').classList.add("slds-hide");

    //Clear sandbox-instance-list
    document.getElementById('sandbox-instance-list').value = "";
    document.getElementById('sandbox-instance-list__error').className = "";
    document.getElementById('sandbox-instance-list__message').classList.add("slds-hide");

    //re-render
    renderInstanceList();

    //Cancel-button enable
    document.getElementById('option-cancel-button').disabled = "";
}

//-------------------------------------------------
// Update UI when any field has changed
//-------------------------------------------------
function saveRequired() {

    // Cancel-button enable
    document.getElementById('option-cancel-button').disabled = "";

    // Check inputs
    let hasError = false;

    // Check production-instance-list
    if (document.getElementById('production-instance-list').value == "") {
        document.getElementById('production-instance-list__error').className = "slds-has-error";
        document.getElementById('production-instance-list__message').classList.remove("slds-hide");
        hasError = true;
    } else {
        document.getElementById('production-instance-list__error').className = "";
        document.getElementById('production-instance-list__message').classList.add("slds-hide");
    }

    // Check sandbox-instance-list
    if (document.getElementById('sandbox-instance-list').value == "") {
        document.getElementById('sandbox-instance-list__error').className = "slds-has-error";
        document.getElementById('sandbox-instance-list__message').classList.remove("slds-hide");
        hasError = true;
    } else {
        document.getElementById('sandbox-instance-list__error').className = "";
        document.getElementById('sandbox-instance-list__message').classList.add("slds-hide");
    }

    // Activate option-save-button
    if (hasError == false) {
        document.getElementById('option-save-button').disabled = "";
    }
}

//-------------------------------------------------
// Save form-data into Chrome strage
//-------------------------------------------------
function saveSetting() {

    // Get fprm-values which had to be memorized
    let myLocation = document.getElementById('location-list').value;
    let productionKey = document.getElementById('production-instance-list').value;
    let sandboxKey = document.getElementById('sandbox-instance-list').value;
    let intervalMin = document.getElementById('interval-list').value;

    // Save settings into Chrome strage, then Call Functions
    let instanceKeys = [productionKey, sandboxKey];
    chrome.storage.local.set({
        'myLocation': myLocation,
        'instanceKeys': instanceKeys,
        'intervalMin': intervalMin,
    }, function() { // Serial order

        // Call updateTrustAll@background.js
        chrome.runtime.sendMessage({
            action: 'updateTrust'
        });

        // Call resetUpdateTrustTimer@background.js
        chrome.runtime.sendMessage({
            action: 'resetUpdateTrustTimer'
        });
    });

    // Disable buttons
    document.getElementById('option-save-button').disabled = "true";
    document.getElementById('option-cancel-button').disabled = "true";

    // Disable forms
    document.getElementById('location-list').disabled = "true";
    document.getElementById('production-instance-list').disabled = "true";
    document.getElementById('sandbox-instance-list').disabled = "true";
    document.getElementById('interval-list').disabled = "true";

    // Show Message
    document.getElementById('savedMessage').className = "slds-transition-show";
    window.setTimeout(function() {

        // Restore forms
        document.getElementById('location-list').disabled = "";
        document.getElementById('production-instance-list').disabled = "";
        document.getElementById('sandbox-instance-list').disabled = "";
        document.getElementById('interval-list').disabled = "";
        document.getElementById('savedMessage').className = "slds-transition-show fadeout";

    }, 2400);
}

//-------------------------------------------------
// Cancel All Changed
//-------------------------------------------------
function cancelSettting() {
    document.location.reload();
}

//-------------------------------------------------
// Render Instance List
//-------------------------------------------------
function renderInstanceList() {
    chrome.storage.local.get(null, function(items) {

        // Get stored JSON data
        let data = items.instances;
        let myLocation = items.myLocation;
        let productionKey = items.instanceKeys[0];
        let sandboxKey = items.instanceKeys[1];
        let intervalMin = items.intervalMin;

        // Override location when location has changed, continue render by selected location
        let currentLocation = document.getElementById('location-list').value;
        if (currentLocation != "" && myLocation != currentLocation) {
            myLocation = currentLocation;
        }

        // Reset listboxes
        document.getElementById('production-instance-list').innerHTML = "";
        document.getElementById('sandbox-instance-list').innerHTML = "";

        // Create listboxes
        Object.keys(data).forEach(function(key) {

            let location = data[key].location;
            let instance = data[key].key;
            let environment = data[key].environment;

            // Create location-List, add option if not defined yet
            let locationOP = document.getElementById('location-' + location);
            if (locationOP == null) {

                // Adding option
                let locationLT = document.getElementById('location-list');
                let locationOP = document.createElement('option');
                locationOP.setAttribute('id', "location-" + location);
                locationOP.setAttribute('label', location);
                locationOP.setAttribute('value', location);
                locationLT.append(locationOP);
            }

            // Process instances only located on myLocation
            if (myLocation == location) {

                // Create option
                let instanceOP = document.createElement('option');
                instanceOP.setAttribute('label', instance);
                instanceOP.setAttribute('value', instance);

                // Switch listbox by environment
                if (environment === 'production') {
                    let instanceLT = document.getElementById('production-instance-list');
                    instanceLT.append(instanceOP);
                } else {
                    let instanceLT = document.getElementById('sandbox-instance-list');
                    instanceLT.append(instanceOP);
                }
            }
        });

        // Restore pre-Selected values
        document.getElementById('location-list').value = myLocation;
        document.getElementById('production-instance-list').value = productionKey;
        document.getElementById('sandbox-instance-list').value = sandboxKey;
        document.getElementById('interval-list').value = intervalMin;
    });
}

//-------------------------------------------------
// Debug
//-------------------------------------------------
function debug(string) {
    document.getElementById("debug").innerHTML = string;
}

//-------------------------------------------------
// Setup Event-Listener
//-------------------------------------------------
window.addEventListener('load', function() {

    // Setup events
    document.getElementById('location-list').addEventListener('change', locationChanged, false);
    document.getElementById('production-instance-list').addEventListener('change', saveRequired, false);
    document.getElementById('sandbox-instance-list').addEventListener('change', saveRequired, false);
    document.getElementById('interval-list').addEventListener('change', saveRequired, false);
    document.getElementById('option-save-button').addEventListener('click', saveSetting, false);
    document.getElementById('option-cancel-button').addEventListener('click', cancelSettting, false);

    // Render
    renderInstanceList();

}, false);
