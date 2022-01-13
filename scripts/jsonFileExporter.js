/* This file will handle the generation of the JSON files to aid in the configuration of a DTN network */

var jsonMenu = document.getElementById("JSON-menu");
var jsonMenuState = 0;
var jsonImportMenu = document.getElementById("JSON-import-menu");
var jsonImportMenuState = 0;
var activeClassName = "JSON-menu--active";
var activeImportClassName = "JSON-import-menu--active";
var includeVis = false;

function createJSON(includeVis) {
    var node = null;
    var myJSONObj = new Object(); //JSON library obj
    var netNodes = new Object();
    var netName = document.getElementById("netModelName").value;
    var netDesc = document.getElementById("netModelDesc").value;
    myJSONObj["netModelName"] = netName;
    myJSONObj["netModelDesc"] = netDesc;
    var usedLabels = [];
    var emptyLabels = 0;
    var sameNameAlert = false;

    //Serialize nodes
    for (i = 0; i < nodeMasterList.length; i++) {
        node = nodeMasterList[i];
        var nodeProtocols = getProtocols(node);
        var nodeServices = getServices(node);
        var nodeLabel = node.nodeLabel;
        var labelExists = true;
        if (nodeLabel == "") {
            sameNameAlert = true;
            while (labelExists) {
                labelExists = false;
                nodeLabel = emptyLabels.toString();
                for (i = 0; i < usedLabels.length; i++) {
                    if (nodeLabel == usedLabels[i]) {
                        labelExists = true;
                        emptyLabels++;
                    }
                }
            }
        }
        usedLabels.push(nodeLabel);
        var nodeType;
        if (node.isIonNodeType) {
            nodeType = "ion";
        }
        else {
            nodeType = "dtn";
        }
        jsonNode = new Object();
        if (document.getElementById("visualizationData").checked || includeVis) {
            jsonNode = {
                //"nodeName": node.nodeLabel,
                "nodeDesc": node.nodeDesc,
                "color": node.color,
                "nodeType": nodeType,
                "endpointID": node.endpointID,
                "protocols": nodeProtocols,
                "services": nodeServices,
                "nodeHost": node.host ? node.host.hostLabel : "",
                "positionX": node.object.position.x,
                "positionY": node.object.position.y,
                "positionZ": node.object.position.z
            };
        } else {
            jsonNode = {
                //"nodeName": node.nodeLabel,
                "nodeDesc": node.nodeDesc,
                "nodeType": nodeType,
                "endpointID": node.endpointID,
                "protocols": nodeProtocols,
                "services": nodeServices,
                "nodeHost": node.host ? node.host.hostLabel : ""
            };
        }
        
        //jsonNode[IONorID] = IONorIDValue;
        netNodes[nodeLabel] = jsonNode;
    }
    myJSONObj["netNodes"] = netNodes;

    //Serialize Links
    var netHops = new Object();
    for (i = 0; i < linkMasterList.length; i++) {
        if (linkMasterList[i].linkMesh.name == "hostLink") continue;
        if (linkMasterList[i].symmetric) { // if the link is symmetric in both directions
            var bpLayer = getBPLayer(linkMasterList[i], 1);
            var ltpLayer = getLTPLayer(linkMasterList[i], 1);
            var jsonLink = {
                "color": linkMasterList[i].color,
                "fromNode": linkMasterList[i].Node1.nodeLabel,
                "toNode": linkMasterList[i].Node2.nodeLabel,
                "bpLayer": bpLayer,
                "ltpLayer": ltpLayer,
                "symmetric": linkMasterList[i].symmetric,
                "maxRate": linkMasterList[i].maxRate12,
                //"startTime": linkMasterList[i].startTime12,
                //"endTime": linkMasterList[i].endTime12,
                "hopDesc": linkMasterList[i].description12
            }
            if (!document.getElementById("visualizationData").checked && !includeVis) {
                delete jsonLink.color;
                delete jsonLink.exists12;
                delete jsonLink.exists21;
            }
            netHops[linkMasterList[i].Node1.nodeLabel + "-" + linkMasterList[i].Node2.nodeLabel] = jsonLink;
        } else if (linkMasterList[i].exists12 || linkMasterList[i].exists21) {
            if (linkMasterList[i].exists12) { // when the link is not symmetric
                var bpLayer = getBPLayer(linkMasterList[i], 1);
                var ltpLayer = getLTPLayer(linkMasterList[i], 1);
                var jsonLink = {
                    "color": linkMasterList[i].color,
                    "fromNode": linkMasterList[i].Node1.nodeLabel,
                    "toNode": linkMasterList[i].Node2.nodeLabel,
                    "bpLayer": bpLayer,
                    "ltpLayer": ltpLayer,
                    "exists12": true,
                    "symmetric": linkMasterList[i].symmetric,
                    "maxRate": linkMasterList[i].maxRate12,
                    //"startTime": linkMasterList[i].startTime12,
                    //"endTime": linkMasterList[i].endTime12,
                    "hopDesc": linkMasterList[i].description12
                }
                if (!document.getElementById("visualizationData").checked && !includeVis) {
                    delete jsonLink.color;
                    delete jsonLink.exists12;
                    delete jsonLink.exists21;
                }
                netHops[linkMasterList[i].Node1.nodeLabel + "-" + linkMasterList[i].Node2.nodeLabel] = jsonLink;
            }
            if (linkMasterList[i].exists21) {
                var bpLayer = getBPLayer(linkMasterList[i], 2);
                var ltpLayer = getLTPLayer(linkMasterList[i], 2);
                var jsonLink = {
                    "color": linkMasterList[i].color,
                    "fromNode": linkMasterList[i].Node2.nodeLabel,
                    "toNode": linkMasterList[i].Node1.nodeLabel,
                    "bpLayer": bpLayer,
                    "ltpLayer": ltpLayer,
                    "exists21": true,
                    "symmetric": linkMasterList[i].symmetric,
                    "maxRate": linkMasterList[i].maxRate21,
                    //"startTime": linkMasterList[i].startTime21,
                    //"endTime": linkMasterList[i].endTime21,
                    "hopDesc": linkMasterList[i].description21
                }
                if (!document.getElementById("visualizationData").checked && !includeVis) {
                    delete jsonLink.color;
                    delete jsonLink.exists12;
                    delete jsonLink.exists21;
                }
                netHops[linkMasterList[i].Node2.nodeLabel + "-" + linkMasterList[i].Node1.nodeLabel] = jsonLink;
            } 
        } else { //connection information hasnt been set up yet
            var bpLayer = getBPLayer(linkMasterList[i], 1);
            var ltpLayer = getLTPLayer(linkMasterList[i], 1);
            var jsonLink = {
                "color": linkMasterList[i].color,
                "fromNode": linkMasterList[i].Node1.nodeLabel,
                "toNode": linkMasterList[i].Node2.nodeLabel,
                "bpLayer": bpLayer,
                "ltpLayer": ltpLayer,
                "exists12": false,
                "exists21": false,
                "symmetric": linkMasterList[i].symmetric,
                "maxRate": linkMasterList[i].maxRate12,
                //"startTime": linkMasterList[i].startTime12,
                //"endTime": linkMasterList[i].endTime12,
                "hopDesc": linkMasterList[i].description12
            }
            if (!document.getElementById("visualizationData").checked && !includeVis) {
                delete jsonLink.color;
                delete jsonLink.exists12;
                delete jsonLink.exists21;
            }
            netHops[linkMasterList[i].Node2.nodeLabel + "-" + linkMasterList[i].Node1.nodeLabel] = jsonLink;
        }
    }
    myJSONObj["netHops"] = netHops;

    //Serialize Hosts
    usedLabels = [];
    emptyLabels = 0;
    var netHosts = new Object();
    for (i = 0; i < hostMasterList.length; i++) {
        host = hostMasterList[i];

        var hostLabel = host.hostLabel;
        var labelExists = true;
        if (hostLabel == "") {
            sameNameAlert = true;
            while (labelExists) {
                labelExists = false;
                hostLabel = emptyLabels.toString();
                for (i = 0; i < usedLabels.length; i++) {
                    if (hostLabel == usedLabels[i]) {
                        labelExists = true;
                        emptyLabels++;
                    }
                }
            }
        }
        usedLabels.push(hostLabel);

        if (document.getElementById("visualizationData").checked || includeVis) {
            var jsonHost = {
                "hostName": host.hostName,
                "hostDesc": host.hostDesc,
                "color": host.color,
                "platform": host.platform,
                "ipAddrs": host.address,
                "hostNodes": host.nodes,
                "positionX": host.object.position.x,
                "positionY": host.object.position.y,
                "positionZ": host.object.position.z,
                "rotationY": host.object.rotation.y
            }
        } else {
            var jsonHost = {
                "hostName": host.hostName,
                "hostDesc": host.hostDesc,
                "platform": host.platform,
                "ipAddrs": host.address,
                "hostNodes": host.nodes
            }
        }
        netHosts[hostLabel] = jsonHost;
    }
    myJSONObj["netHosts"] = netHosts;

    if (sameNameAlert) {
        if (confirm("At least one node or host is not labeled. This might cause problems when exporting the JSON file. Would you like to still continue?") == false) {
            return;
        }
    }

    //Serialize node position data in single Host view mode
    if (document.getElementById("visualizationData").checked || includeVis) {
        myJSONObj["localViewPos"] = nodePosDict;
        var hostLinks = {};
        for (var key in hostLinkMasterList) {
            hostLinks[key] = hostLinkMasterList[key].color;
        }
        myJSONObj["localHostLinks"] = hostLinks;
    }

    var JSONFile = JSON.stringify(myJSONObj, null, 4);
    return JSONFile;
}

function getBPLayer(link, direction) {
    if (direction == 1) {
        if (link.tcp12 == true) { return "tcp"; }
        else if (link.ltp12 == true) { return "ltp"; }
        else if (link.udp12 == true) { return "udp"; }
        else if (link.stcp12 == true) { return "stcp"; }
        else if (link.dccp12 == true) { return "dccp"; }
        else if (link.bpLayerOther12 == true) { return link.bpLayerOtherText12.toLowerCase(); }
        else { return ""; }
    }
    if (direction == 2) {
        if (link.tcp21 == true) { return "tcp"; }
        else if (link.ltp21 == true) { return "ltp"; }
        else if (link.udp21 == true) { return "udp"; }
        else if (link.stcp21 == true) { return "stcp"; }
        else if (link.dccp21 == true) { return "dccp"; }
        else if (link.bpLayerOther21 == true) { return link.bpLayerOtherText21.toLowerCase(); }
        else { return ""; }
    }
}

function getLTPLayer(link, direction) {
    if (getBPLayer(link, direction) == "ltp") {
        if (direction == 1) { return link.ltpLayer12.toLowerCase(); }
        if (direction == 2) { return link.ltpLayer21.toLowerCase(); }
    }
    else {
        return "";
    }
}

function getProtocols(node) {
    var nodeProtocols = [];
    if (node.ltp == true) { nodeProtocols.push("ltp"); }
    if (node.stcp == true) { nodeProtocols.push("stcp"); }
    if (node.tcp == true) { nodeProtocols.push("tcp"); }
    if (node.udp == true) { nodeProtocols.push("udp"); }
    if (node.otherProtocol != "") {
        var protocols = node.otherProtocol.replace(/\s/g, "");
        protocols = protocols.split(',');
        for (var i = 0; i < protocols.length; i++) {
            nodeProtocols.push(protocols[i]);
        }
    }
    return nodeProtocols;
}

function getServices(node) {
    var nodeServices = [];
    if (node.cfdp == true) { nodeServices.push("cfdp"); }
    if (node.ams == true) { nodeServices.push("ams"); }
    if (node.otherService != "") {
        var services = node.otherService.replace(/\s/g, "");
        services = services.split(',');
        for (var i = 0; i < services.length; i++) {
            nodeServices.push(services[i]);
        }
    }
    return nodeServices;
}


function appendObjectToJSON(obj, jsonFile) {
    var jsonParsed = JSON.parse(jsonFile); // parse the JSON
    jsonParsed.push(obj); // Add the new obj
    var updatedJSON = JSON.stringify(jsonParsed); // Reserialize to JSON
    return updatedJSON;
}


/**
/* Generate zip file 
/* node_data: converted graph node info, which is output in converter js function
/* link_data: same as above except for links
*/
function generateZip(node_data, link_data) {
    if (typeof window.FileReader !== 'function') {
        alert("File API not supported. Use different modern browser!");
        return;
    }

    if (!validate(node_data, link_data))
        return;

    var basic_setup = {};
    basic_setup['node_numbers_and_IP'] = convertBasicNodeInfo(node_data);
    basic_setup['edge_list'] = convertBasicLinkInfo(node_data, link_data);

    var adv_setup = { 'DEFAULT': true };

    var config_files = generateConfig('node', basic_setup, adv_setup);

    var zip = new JSZip();
    var folder = null;

    for (var node_folder in config_files) {
        folder = zip.folder(node_folder);
        if (!config_files.hasOwnProperty(node_folder)) continue;
        var files = config_files[node_folder];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            folder.file(file[0], file[1]);
        }
    }

    zip.generateAsync({ type: "blob" })
        .then(function (blob) {
            saveAs(blob, "config_files.zip");
        });

    return config_files;
}




// Handles the creation of the JSON file, converting to Blob, and then downloading the file.
function generateJSONFiles() {
    var fileName = document.getElementById("filename").value;
    var JSONFile = createJSON();
    if (JSONFile != undefined) {
        var JSONBlob = new Blob([JSONFile], { type: "application/json" });
        saveAs(JSONBlob, fileName + '.json');
        toggleJSONMenuOff();
        //return JSONFile;
        return false;
    }
    else {
        toggleJSONMenuOff();
    }
    return false;

}



function toggleJSONMenuOn() {
    if (jsonMenuState !== 1) {
        jsonMenuState = 1;
        jsonMenu.classList.add(activeClassName);
        toggleLinkMenuOff();
        toggleNodeMenuOff();
        toggleJSONImportMenuOff();
    }
    insideMenu = true;
}

function toggleJSONMenuOff() {
    if (jsonMenuState !== 0) {
        jsonMenuState = 0;
        jsonMenu.classList.remove(activeClassName);
    }
    insideMenu = false;
    return false;
}

// IMPORTER
function toggleJSONImportMenuOn() {
    if (jsonImportMenuState !== 1) {
        jsonImportMenuState = 1;
        jsonImportMenu.classList.add(activeImportClassName);
        toggleLinkMenuOff();
        toggleNodeMenuOff();
        toggleJSONMenuOff();
        insideMenu = true;
    }
}

function toggleJSONImportMenuOff() {
    if (jsonImportMenuState !== 0) {
        jsonImportMenuState = 0;
        jsonImportMenu.classList.remove(activeImportClassName);
        insideMenu = false;
    }
    return false;
}