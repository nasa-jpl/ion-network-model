/* *******************************************************************************************************
   This script controls turning the context menus on and off and controlling how they work/what they display, 
   and how they get the information inputed. 
   *******************************************************************************************************/

var arrows;
var selectedNode, selectedLink, selectedArrow;
var hiddenNodeList = [];
var hiddenLinkList = [];
var linkIntersect;

/*Variables*/
var taskItemClassName = 'task';
var nodeMenu = document.getElementById("node-menu");
var hostMenu = document.getElementById("host-menu");
var linkMenu = document.getElementById("link-menu");
var addMenu = document.getElementById("add-menu");

var nodeMenuState = 0;
var hostMenuState = 0;
var linkMenuState = 0;
var addMenuState = 0;
var activeClassName = "context-menu--active";
var menuPosition;
var menuPositionX;
var menuPositionY;
var shiftDown, hDown;


document.addEventListener("contextmenu", function (event) {
    if (clickInsideNode(event)) {
        event.preventDefault();
        selectNode(getObject(intersect.object));
        positionMenu(event);
    }
    else if (clickedInsideLink(event)) {
        event.preventDefault();
        getLinkIntersect();

        if (selectedLink) {
            if (!selectedLink.color) {
                changeLinkColor("White");
            } else {
                changeLinkColor(selectedLink.color);
            }
        }
        selectedLink = getLink(linkIntersect.object);
        selectedLink.linkMesh.material.color.set(0x2AD6FA);

        toggleNodeMenuOff();
        toggleAddMenu(false);
        hideAllMenus();
        toggleLinkMenuOn();
    }
    else {
        toggleAddMenu(false);
        toggleNodeMenuOff();
        toggleLinkMenuOff();
        hideAllMenus();
        removeArrows();
    }
});

document.addEventListener('keyup', function (event) {
    if (event.keyCode == 72) { // when the 'h' key is released, hide the selected node and the corresponding links. 
        hDown = false;
    }
    if (event.keyCode == 16) {
        shiftDown = false;
    }
});

/*console.log(document.getElementsByTagName('canvas')[0]);
document.getElementsByTagName('canvas')[0].addEventListener('keydown', function (event) {
    if (isInForm && [37, 38, 39, 40].includes(event.keyCode)) {
        console.log("arrow key pressed");
        //document.getElementsByTagName('canvas')[0].focus();
        event.preventDefault();
        //event.target.focus();
    }
}, false);*/

document.addEventListener('keydown', function (event) {
    if (isInForm && [37, 38, 39, 40].includes(event.keyCode)) {
        THREE.OrbitControls.enablePan = false;
    } else {
        THREE.OrbitControls.enablePan = true;
    }
    if (event.keyCode == 72 && !isInForm) { // when shift + h is pressed unhide everything
        hDown = true;
    }
    if (event.keyCode == 16) { // when shift is pressed
        shiftDown = true;
    }
    hideController();
});

document.getElementById("numOfNodes").addEventListener('blur', function (event) {
    if (selectedNode) {
        updateEditorNodes(selectedNode);
        if (showLabels) {
            updateHostLabel(selectedNode);
        }
    }
});

function hideController() {
    if (shiftDown && hDown) { // unhiding
        unhide();
    }
    if (hDown && !shiftDown) { // hiding nodes
        hide(selectedNode);
    }
}

function setInForm(bool) {
    isInForm = bool;
}

// visually selects a node and toggles node menu
function selectNode(node) { 
    if (!node) return;
    if (selectedNode) {
        selectedNode.object.material.opacity = 1;
        toggleNodeMenuOff();
    }
    selectedNode = node;
    latestNode = node.object;
    selectedNode.object.material.opacity = 0.5;
    toggleLinkMenuOff();
    toggleAddMenu(false);
    hideAllMenus();
    toggleNodeMenuOn(); // Toggle the menu for this specific node
    if (!arrows) {
        arrows = instantiateControls(selectedNode.object);
    }
}

//called from hierarchy; sets selectedNode and toggles node manu on
function selectNodeFromHierarchy(nodeLabel, event) { 
    event.cancelBubble = true;
    if (event.stopPropagation) event.stopPropagation();
    var node = getObjectFromLabel(nodeLabel);
    selectNode(node);
}
function selectHostFromHierarchy(hostLabel, event) {
    event.cancelBubble = true;
    if (event.stopPropagation) event.stopPropagation();
    var host = getObjectFromLabel(hostLabel, true);
    selectNode(host);
}

//this method saves the data in the context menu for a selected host and updates scale
function updateEditorNodes(host) {
    var updatedNum = Number(document.getElementById("numOfNodes").value);
    var nodeTextBoxes = document.getElementById("nodeList").getElementsByTagName("input");
    if (!host || host.object.name != "Host") {
        return;
    }
    host.position = host.object.position;
    //console.log(updatedNum+ "<" +host.nodes.length);
    if (updatedNum < host.nodes.length) { //if the new number is less than the previous number, remove some nodes
        for (i = host.nodes.length; i > updatedNum; i--) {
            document.getElementById("nodeList").removeChild(document.getElementById(nodeTextBoxes.length.toString()));
            document.getElementById("nodeList").removeChild(nodeTextBoxes[nodeTextBoxes.length - 1]);
            var removedNode = getObjectFromLabel(host.nodes.pop());

            for (k = 0; k < linkMasterList.length; k++) { //remove hostLinks if necessary
                if (linkMasterList[k].Node1 == removedNode || linkMasterList[k].Node2 == removedNode) { //only look at links for the node being removed
                    if (!linkMasterList[k].Node1.host || !linkMasterList[k].Node2.host) continue;
                    var key = linkMasterList[k].Node1.host.hostLabel + linkMasterList[k].Node2.host.hostLabel;
                    if (key in hostLinkMasterList) {
                        var create = false;
                        for (var j = 0; j < linkMasterList.length; j++) {
                            if ((linkMasterList[j].Node1.host != linkMasterList[j].Node2.host) //try to find link that connects the two hosts besides the one connected to the node getting removed
                                && (linkMasterList[j].Node1.host == linkMasterList[k].Node1.host)
                                && (linkMasterList[j].Node2.host == linkMasterList[k].Node2.host)
                                && linkMasterList[k] != linkMasterList[j]
                                && linkMasterList[j].Node1 != removedNode && linkMasterList[j].Node2 != removedNode
                            ) {
                                create = true;
                            }
                        }
                        if (!create) {
                            scene.remove(hostLinkMasterList[key].linkMesh);
                            delete hostLinkMasterList[key];
                        }
                    }
                }
            }

            removedNode.host = null;
            if (document.getElementById("nodeList").getElementsByTagName("input").length == 0) {
                document.getElementById("nodeList").removeChild(document.getElementById("nodeLabels"));
            }
        }
    } else { //text boxes need to be added because the number increased (or stayed the same)
        var count = updatedNum - host.nodes.length;
        for (i = 1; i <= count; i++) {
            if (!document.getElementById("nodeLabels")) {
                var title = document.createElement('div');
                title.setAttribute("id", "nodeLabels");
                title.textContent = "Node Labels:";
                document.getElementById("nodeList").appendChild(title);
            }
            document.getElementById("nodeList").style.display = "block";
            var entry = document.createElement('input');
            entry.setAttribute("type", "text");
            entry.setAttribute("value", "");
            entry.setAttribute("onclick", "setInForm(true);");
            entry.setAttribute("tabindex", "1");
            entry.appendChild(document.createTextNode(""));
            var button = document.createElement('button');
            button.textContent = "X";
            button.setAttribute("id", (host.nodes.length + i).toString());
            button.setAttribute("type", "button");
            button.setAttribute("onclick", "deleteNodeFromHost(event);");
            button.setAttribute("tabindex", "2");
            var newLine = document.createElement('br');
            document.getElementById("nodeList").appendChild(entry);
            document.getElementById("nodeList").appendChild(button);
        }
    }
    var tempOldHost = [];
    for (i = 0; i < nodeTextBoxes.length; i++) { //update the list of nodes in the selected Hosts class and checks labels
        if (host.nodes.length < nodeTextBoxes.length) {
            host.nodes.push("");
        }
        host.nodes[i] = nodeTextBoxes[i].value;
        for (j = 0; j < nodeMasterList.length; j++) { //for each node textbox, search for the label in the node master list
            if (nodeTextBoxes[i].value != "" && nodeTextBoxes[i].value == nodeMasterList[j].nodeLabel) { //if the text box is not empty and it theres a matching label
                if (host.object.rotation.y == 0) {
                    if (nodeTextBoxes.length % 2 == 0) { //if the number of nodes is even
                        var xOffset = ((nodeTextBoxes.length / (nodeTextBoxes.length * 2)) * 5);
                        if (i + 1 <= nodeTextBoxes.length / 2) {
                            xOffset += ((nodeTextBoxes.length / 2) - (i + 1)) * 5;
                            xOffset *= -1;
                        } else {
                            xOffset += ((i + 1) - (nodeTextBoxes.length / 2 + 1)) * 5;
                        }
                        nodeMasterList[j].object.position.set(host.object.position.x + xOffset, host.object.position.y + 2.5, host.object.position.z);
                    } else { //the number of nodes is odd
                        var xOffset = 0;
                        if (i + 1 < Math.ceil(nodeTextBoxes.length / 2)) {
                            xOffset += (Math.ceil(nodeTextBoxes.length / 2) - (i + 1)) * 5;
                            xOffset *= -1;
                        } else if (i + 1 > Math.ceil(nodeTextBoxes.length / 2)) {
                            xOffset += ((i + 1) - (Math.ceil(nodeTextBoxes.length / 2))) * 5;
                        }
                        nodeMasterList[j].object.position.set(host.object.position.x + xOffset, host.object.position.y + 2.5, host.object.position.z);
                    }
                    if (nodeMasterList[j].host && nodeMasterList[j].host != host) {
                        nodeMasterList[j].host.nodes.splice(nodeMasterList[j].host.nodes.indexOf(nodeMasterList[j].nodeLabel), 1);
                        if (!tempOldHost.includes(nodeMasterList[j].host)) {
                            tempOldHost.push(nodeMasterList[j].host);
                        }
                    }
                    nodeMasterList[j].host = host;
                    //console.log(nodeMasterList[j].nodeLabel + " has host: ", nodeMasterList[j].host);
                }
                else if (host.object.rotation.y == Math.PI / 2) {
                    if (nodeTextBoxes.length % 2 == 0) { //if the number of nodes is even
                        var xOffset = ((nodeTextBoxes.length / (nodeTextBoxes.length * 2)) * 5);
                        if (i + 1 <= nodeTextBoxes.length / 2) {
                            xOffset += ((nodeTextBoxes.length / 2) - (i + 1)) * 5;
                            xOffset *= -1;
                        } else {
                            xOffset += ((i + 1) - (nodeTextBoxes.length / 2 + 1)) * 5;
                        }
                        xOffset *= -1;
                        nodeMasterList[j].object.position.set(host.object.position.x, host.object.position.y + 2.5, host.object.position.z + xOffset);
                    } else { //the number of nodes is odd
                        var xOffset = 0;
                        if (i + 1 < Math.ceil(nodeTextBoxes.length / 2)) {
                            xOffset += (Math.ceil(nodeTextBoxes.length / 2) - (i + 1)) * 5;
                            xOffset *= -1;
                        } else if (i + 1 > Math.ceil(nodeTextBoxes.length / 2)) {
                            xOffset += ((i + 1) - (Math.ceil(nodeTextBoxes.length / 2))) * 5;
                        }
                        xOffset *= -1;
                        nodeMasterList[j].object.position.set(host.object.position.x, host.object.position.y + 2.5, host.object.position.z + xOffset);
                    }
                    if (nodeMasterList[j].host && nodeMasterList[j].host != host) {
                        nodeMasterList[j].host.nodes.splice(nodeMasterList[j].host.nodes.indexOf(nodeMasterList[j].nodeLabel), 1);
                        if (!tempOldHost.includes(nodeMasterList[j].host)) {
                            tempOldHost.push(nodeMasterList[j].host);
                        }
                    }
                    nodeMasterList[j].host = host;
                }
                else if (host.object.rotation.y == Math.PI) {
                    if (nodeTextBoxes.length % 2 == 0) { //if the number of nodes is even
                        var xOffset = ((nodeTextBoxes.length / (nodeTextBoxes.length * 2)) * 5);
                        if (i + 1 <= nodeTextBoxes.length / 2) {
                            xOffset += ((nodeTextBoxes.length / 2) - (i + 1)) * 5;
                            xOffset *= -1;
                        } else {
                            xOffset += ((i + 1) - (nodeTextBoxes.length / 2 + 1)) * 5;
                        }
                        xOffset *= -1;
                        nodeMasterList[j].object.position.set(host.object.position.x + xOffset, host.object.position.y + 2.5, host.object.position.z);
                    } else { //the number of nodes is odd
                        var xOffset = 0;
                        if (i + 1 < Math.ceil(nodeTextBoxes.length / 2)) {
                            xOffset += (Math.ceil(nodeTextBoxes.length / 2) - (i + 1)) * 5;
                            xOffset *= -1;
                        } else if (i + 1 > Math.ceil(nodeTextBoxes.length / 2)) {
                            xOffset += ((i + 1) - (Math.ceil(nodeTextBoxes.length / 2))) * 5;
                        }
                        xOffset *= -1;
                        nodeMasterList[j].object.position.set(host.object.position.x + xOffset, host.object.position.y + 2.5, host.object.position.z);
                    }
                    if (nodeMasterList[j].host && nodeMasterList[j].host != host) {
                        nodeMasterList[j].host.nodes.splice(nodeMasterList[j].host.nodes.indexOf(nodeMasterList[j].nodeLabel), 1);
                        if (!tempOldHost.includes(nodeMasterList[j].host)) {
                            tempOldHost.push(nodeMasterList[j].host);
                        }
                    }
                    nodeMasterList[j].host = host;
                }
                else {
                    if (nodeTextBoxes.length % 2 == 0) { //if the number of nodes is even
                        var xOffset = ((nodeTextBoxes.length / (nodeTextBoxes.length * 2)) * 5);
                        if (i + 1 <= nodeTextBoxes.length / 2) {
                            xOffset += ((nodeTextBoxes.length / 2) - (i + 1)) * 5;
                            xOffset *= -1;
                        } else {
                            xOffset += ((i + 1) - (nodeTextBoxes.length / 2 + 1)) * 5;
                        }
                        nodeMasterList[j].object.position.set(host.object.position.x, host.object.position.y + 2.5, host.object.position.z + xOffset);
                    } else { //the number of nodes is odd
                        var xOffset = 0;
                        if (i + 1 < Math.ceil(nodeTextBoxes.length / 2)) {
                            xOffset += (Math.ceil(nodeTextBoxes.length / 2) - (i + 1)) * 5;
                            xOffset *= -1;
                        } else if (i + 1 > Math.ceil(nodeTextBoxes.length / 2)) {
                            xOffset += ((i + 1) - (Math.ceil(nodeTextBoxes.length / 2))) * 5;
                        }
                        nodeMasterList[j].object.position.set(host.object.position.x, host.object.position.y + 2.5, host.object.position.z + xOffset);
                    }
                    if (nodeMasterList[j].host && nodeMasterList[j].host != host) {
                        nodeMasterList[j].host.nodes.splice(nodeMasterList[j].host.nodes.indexOf(nodeMasterList[j].nodeLabel), 1);
                        if (!tempOldHost.includes(nodeMasterList[j].host)) {
                            tempOldHost.push(nodeMasterList[j].host);
                        }
                    }
                    nodeMasterList[j].host = host;
                }
            }
        }
    }
    var tempLength = tempOldHost.length;
    for (var i = 0; i < tempLength; i++) { //This should be when node are being moved from one host to another
        switchEditorNodes(tempOldHost[0]); //switch to update the old host
        updateEditorNodes(tempOldHost[0]); //update the old host
        if (showLabels) {
            updateHostLabel(tempOldHost[0]);
        }
        tempOldHost.splice(0, 1);
        switchEditorNodes(host); //switch back to the current host
    }
    if (host.nodes.length <= 0) {
        host.object.scale.set(1, host.object.scale.y, host.object.scale.z);
    } else {
        host.object.scale.set(host.nodes.length, host.object.scale.y, host.object.scale.z);
    }
    updateHierarchy();
}

//for switching the number of textboxes between two hosts
function switchEditorNodes(host) {
    var updatedNum = host.nodes.length;
    var nodeTextBoxes = document.getElementById("nodeList").getElementsByTagName("input");
    //console.log(updatedNum + " < " + nodeTextBoxes.length);
    if (updatedNum < nodeTextBoxes.length && nodeTextBoxes.length > 0) {
        for (i = nodeTextBoxes.length; i > updatedNum; i--) {
            document.getElementById("nodeList").removeChild(document.getElementById(nodeTextBoxes.length.toString()));
            document.getElementById("nodeList").removeChild(nodeTextBoxes[nodeTextBoxes.length - 1]);
            if (document.getElementById("nodeList").getElementsByTagName("input").length == 0) {
                document.getElementById("nodeList").removeChild(document.getElementById("nodeLabels"));
            }
        }
    } else {
        var tempLength = nodeTextBoxes.length;
        var count = updatedNum - tempLength;
        for (i = 1; i <= count; i++) {
            if (!document.getElementById("nodeLabels")) {
                var title = document.createElement('div');
                title.setAttribute("id", "nodeLabels");
                title.textContent = "Node Labels:"
                document.getElementById("nodeList").appendChild(title);
            }
            document.getElementById("nodeList").style.display = "block";
            var entry = document.createElement('input');
            entry.setAttribute("type", "text");
            entry.setAttribute("value", "");
            entry.setAttribute("onclick", "setInForm(true)");
            entry.setAttribute("tabindex", "1");
            entry.appendChild(document.createTextNode(""));
            var button = document.createElement('button');
            button.textContent = "X";
            button.setAttribute("id", (tempLength + i).toString());
            button.setAttribute("type", "button");
            button.setAttribute("onclick", "deleteNodeFromHost(event);");
            button.setAttribute("tabindex", "2");
            document.getElementById("nodeList").appendChild(entry);
            document.getElementById("nodeList").appendChild(button);
        }
    }
    document.getElementById("numOfNodes").value = updatedNum;
    setEditorNodes(host);
}

//this method updates the text of the textboxes for a host's nodes. This is called in switchEditorNodes.
function setEditorNodes(host) {
    var nodeTextBoxes = document.getElementById("nodeList").getElementsByTagName("input");
    for (i = 0; i < host.nodes.length; i++) {
        nodeTextBoxes[i].value = host.nodes[i];
    }
}

/* Helper functions */

function hide(obj) {
    if (obj) {
        obj.object.visible = false;
        hiddenNodeList.push(obj); // add this node to the hidden node list  
        for (i = 0; i < linkMasterList.length; i++) { //if node has a link, hide it
            if (linkMasterList[i].Node1 == obj || linkMasterList[i].Node2 == obj) {
                linkMasterList[i].linkMesh.visible = false;
                hiddenLinkList.push(linkMasterList[i]);
            }
        }
    }
}

function unhide() {
    if (hiddenNodeList.length > 0) {
        for (i = 0; i < hiddenNodeList.length; i++) {
            hiddenNodeList[i].object.visible = true;
        }
        for (i = 0; i < hiddenLinkList.length; i++) {
            hiddenLinkList[i].linkMesh.visible = true;
        }
    }
    hiddenNodeList = []; // clear the hidden node list 
    for (var key in hostLinkMasterList) {
        var link = hostLinkMasterList[key];
        if (link.linkMesh) {
            link.linkMesh.material.visible = false;
        }
    }
}

function getLinkIntersect() {
    var intersections = raycaster.intersectObjects(scene.children, false);
    if (intersections.length > 0) {
        for (i = 0; i < intersections.length; i++) {
            if (intersections[i].object.name == "Link" || intersections[i].object.name == "hostLink") {
                linkIntersect = intersections[i];
                break;
            }
        }
    }
}

function getArrowIntersect() {
    var intersections = raycaster.intersectObjects(scene.children, false);
    if (intersections.length > 0) {
        for (i = 0; i < intersections.length; i++) {
            if (intersect.object.name == "yArrow" || intersect.object.name == "xArrow" || intersect.object.name == "zArrow") {
                selectedArrow = intersections[i];
                break;
            }
        }
    }
}

/* This function should take the event data and return true if the click takes place when clicking on a node or a link */
function clickInsideNode(event) {
    updateIntersect();
    if (intersect && (intersect.object.name == "Node" || intersect.object.name == "Host")) {
        return true;
    }
    return false;
}

/* This function should take the event data and return true if the click takes place when clicking a link */
function clickedInsideLink(event) {
    updateIntersect();
    if (intersect && (intersect.object.name == "Link" || intersect.object.name == "hostLink")) {
        return true;
    }
    return false;
}

function getPosition(e) {
    var posx = 0;
    var posy = 0;

    if (!e) var e = window.event;

    if (e.pageX || e.pageY) {
        posx = e.pageX;
        posy = e.pageY;
    } else if (e.clientX || e.clientY) {
        posx = e.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
        posy = e.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
    }

    return {
        x: posx,
        y: posy
    }
}

function positionMenu(e) {
    menuPosition = getPosition(e);
}

/**
* Listens for contextmenu events.
*/
function contextListener() {
    document.addEventListener("contextmenu", function (e) {
        if (clickInsideNode(e, taskItemClassName)) {
            e.preventDefault();
            updateIntersect();
            selectedNode = getObject(intersect.object);
            toggleNodeMenuOn();
        } else {
            toggleNodeMenuOff();
        }
    });
}

//loads the control arrows from a gltf file
function instantiateControls(node) { //instantiates 3 XYZ arrows for blender-like control of nodes
    // Instantiate a loader
    var loader = new THREE.GLTFLoader();
    var controls = [];
    // Load a glTF resource
    loader.load(
        'models/arrows.gltf',
        function (gltf) {
            var len = gltf.scene.children.length;
            for (var i = 0; i < len; i++) {
                gltf.scene.children[0].position.set(selectedNode.object.position.x, selectedNode.object.position.y, selectedNode.object.position.z);
                gltf.scene.children[0].renderOrder = 999;
                controls.push(gltf.scene.children[0]);
                scene2.add(gltf.scene.children[0]);
            }
        }
    );
    return controls;
}

/**
 * Turns the custom context menu on.
 */
function toggleNodeMenuOn() {
    if (selectedNode.object.name == "Host") { //if selectedNode is a "Host"
        if (nodeMenuState === 1) { //if the node menu is already up, close it
            nodeMenuState = 0;
            nodeMenu.classList.remove(activeClassName);
        }
        if (hostMenuState !== 1) {
            hostMenuState = 1;
            hostMenu.classList.add(activeClassName);
        }
        switch (selectedNode.platform) {
            case 'windows':
                document.getElementById("Windows").checked = true;
                document.getElementById("Unix").checked = false;
                document.getElementById("Mac").checked = false;
                document.getElementById("otherPlatform").checked = false;
                document.getElementById("otherPlatformText").value = "";
                break;
            case 'unix':
                document.getElementById("Windows").checked = false;
                document.getElementById("Unix").checked = true;
                document.getElementById("Mac").checked = false;
                document.getElementById("otherPlatform").checked = false;
                document.getElementById("otherPlatformText").value = "";
                break;
            case 'mac':
                document.getElementById("Windows").checked = false;
                document.getElementById("Unix").checked = false;
                document.getElementById("Mac").checked = true;
                document.getElementById("otherPlatform").checked = false;
                document.getElementById("otherPlatformText").value = "";
                break;  
            default:
                document.getElementById("Windows").checked = false;
                document.getElementById("Unix").checked = false;
                document.getElementById("Mac").checked = false;
                document.getElementById("otherPlatform").checked = true;
                document.getElementById("otherPlatformText").value = selectedNode.platform;
        }
        switchEditorNodes(selectedNode);
        document.getElementById("IP").value = selectedNode.address.join(',');
        document.getElementById("hostDesc").value = selectedNode.hostDesc;
        document.getElementById("hostLabel").value = selectedNode.hostLabel;
        document.getElementById("hostX").value = selectedNode.object.position.z / 10;
        document.getElementById("hostY").value = selectedNode.object.position.x / 10;
        document.getElementById("hostZ").value = selectedNode.object.position.y / 10;
    }
    else { //if selectedNode is a "Node"
        if (hostMenuState === 1) { //if the node menu is already up, close it
            hostMenuState = 0;
            hostMenu.classList.remove(activeClassName);
        }
        if (nodeMenuState !== 1) {
            nodeMenuState = 1;
            nodeMenu.classList.add(activeClassName);
        }
        document.getElementById("nodeDesc").value = selectedNode.nodeDesc;
        document.getElementById("nodeType").checked = selectedNode.isIonNodeType;
        document.getElementById("DTN nodeType").checked = !selectedNode.isIonNodeType;
        if (selectedNode.isIonNodeType) {
            // Change Node Label to Node ID
            document.getElementById("nodeLabelInnerText").innerText = "ION Node Number:"
        } else {
            // Change Node Label to ION Node Num
            document.getElementById("nodeLabelInnerText").innerText = "Node ID:"
        }
        document.getElementById("endpointID").value = selectedNode.endpointID;
        document.getElementById("nodeLabel").value = selectedNode.nodeLabel;

        document.getElementById("ltp").checked = selectedNode.ltp;
        document.getElementById("udp").checked = selectedNode.udp;
        document.getElementById("tcp").checked = selectedNode.tcp;
        document.getElementById("stcp").checked = selectedNode.stcp;
        document.getElementById("otherProtocol").value = selectedNode.otherProtocol;

        document.getElementById("cfdp").checked = selectedNode.cfdp;
        document.getElementById("ams").checked = selectedNode.ams;
        document.getElementById("otherService").value = selectedNode.otherService;

        document.getElementById("nodeX").value = selectedNode.object.position.z / 10;
        document.getElementById("nodeY").value = selectedNode.object.position.x / 10;
        document.getElementById("nodeZ").value = selectedNode.object.position.y / 10;
    }
    document.getElementById("Color").value = selectedNode.color;
    toggleJSONMenuOff();
    toggleJSONImportMenuOff();
    insideMenu = true;

}

/**
 * Turns the custom context menu on.
 */
function toggleLinkMenuOn() {
    if (linkMenuState !== 1) {
        linkMenuState = 1;
        linkMenu.classList.add(activeClassName);
    }
    if (selectedLink.linkMesh.name == "hostLink") {
        document.getElementById("Link Color").value = selectedLink.color;
        toggleHostLinkMenu(true);
    } else {
        toggleHostLinkMenu(false);
        updateLinkDOMElements();
        toggleLink12();
        toggleLink21();
    }
    toggleSymmetric();
    toggleJSONMenuOff();
    toggleJSONImportMenuOff();
    insideMenu = true;
}

function toggleAddMenu(enable) {
    if (enable) {
        if (addMenuState !== 1) {
            addMenuState = 1;
            addMenu.classList.add(activeClassName);
        }
        if (inspectingHost || viewMode === 1) { //disable add host
            document.getElementById("placeHostDisable").disabled = true;
        } else {
            document.getElementById("placeHostDisable").disabled = false;
        }
        if (viewMode === 2) { //disable add host
            document.getElementById("placeNodeDisable").disabled = true;
        } else {
            document.getElementById("placeNodeDisable").disabled = false;
        }
        //console.log(mouseClientX + "and" + mouseClientY);
        document.getElementById("add-menu").style.left = mouseClientX + "px";
        document.getElementById("add-menu").style.top = mouseClientY + "px";
        //console.log(document.getElementById("add-menu").style.left + "and" + document.getElementById("add-menu").style.top);
    } else {
        if (addMenuState !== 0) {
            addMenuState = 0;
            addMenu.classList.remove(activeClassName);
        }
    }
}

function updateLinkDOMElements() {
    document.getElementById("symmetric").checked = selectedLink.symmetric;
    if (!selectedLink.symmetric) {
        var nodeLabel1 = selectedLink.Node1.nodeLabel;
        var nodeLabel2 = selectedLink.Node2.nodeLabel;
        if (nodeLabel1 == "") { nodeLabel1 = "?"; }
        if (nodeLabel2 == "") { nodeLabel2 = "?"; }
        document.getElementById("Node 1 to 2 Column").innerText = nodeLabel1 + "-to-" + nodeLabel2;
        document.getElementById("Node 2 to 1 Column").innerText = nodeLabel2 + "-to-" + nodeLabel1;
    }
    document.getElementById("Link Color").value = selectedLink.color;

    document.getElementById("Link Exists12").checked = selectedLink.exists12;
    document.getElementById("Max Rate12").value = selectedLink.maxRate12;
    //document.getElementById("startTime12").value = selectedLink.startTime12;
    //document.getElementById("endTime12").value = selectedLink.endTime12;
    document.getElementById("TCP12").checked = selectedLink.tcp12;
    document.getElementById("LTP12").checked = selectedLink.ltp12;
    document.getElementById("UDP12").checked = selectedLink.udp12;
    document.getElementById("STCP12").checked = selectedLink.stcp12;
    document.getElementById("DCCP12").checked = selectedLink.dccp12;
    if (selectedLink.bpLayerOther12) {
        document.getElementById("otherBPLayer12").checked = true;
        document.getElementById("otherBPLayerText12").value = selectedLink.bpLayerOtherText12;
    }
    else {
        document.getElementById("otherBPLayerText12").value = "";
    }
    if (selectedLink.ltp12) {
        document.getElementById("LTP12").checked = true;
        document.getElementById("LTP Layer12").value = selectedLink.ltpLayer12;
    }
    else {
        document.getElementById("LTP Layer12").value = "";
    }
    document.getElementById("Description12").value = selectedLink.description12;

    document.getElementById("Link Exists21").checked = selectedLink.exists21;
    document.getElementById("Max Rate21").value = selectedLink.maxRate21;
    //document.getElementById("startTime21").value = selectedLink.startTime21;
    //document.getElementById("endTime21").value = selectedLink.endTime21;
    document.getElementById("TCP21").checked = selectedLink.tcp21;
    document.getElementById("LTP21").checked = selectedLink.ltp21;
    document.getElementById("UDP21").checked = selectedLink.udp21;
    document.getElementById("STCP21").checked = selectedLink.stcp21;
    document.getElementById("DCCP21").checked = selectedLink.dccp21;
    if (selectedLink.bpLayerOther21) {
        document.getElementById("otherBPLayer21").checked = true;
        document.getElementById("otherBPLayerText21").value = selectedLink.bpLayerOtherText21;
    }
    else {
        document.getElementById("otherBPLayerText21").value = "";
    }
    if (selectedLink.ltp21) {
        document.getElementById("LTP21").checked = true;
        document.getElementById("LTP Layer21").value = selectedLink.ltpLayer21;
    }
    else {
        document.getElementById("LTP Layer21").value = "";
    }
    document.getElementById("Description21").value = selectedLink.description21;
}

/* Called whenever the node menu needs to be turned off */
function toggleNodeMenuOff() {
    // change the opacity back to normal
    if (selectedNode) {
        selectedNode.object.material.opacity = 1;
        if (selectedNode.object.name == "Host") {
            if (hostMenuState !== 0) {
                hostMenuState = 0;
                hostMenu.classList.remove(activeClassName);
            }
            if (showLabels) {
                updateHostLabel(selectedNode);
            }
        } else {
            if (nodeMenuState !== 0) {
                nodeMenuState = 0;
                nodeMenu.classList.remove(activeClassName);
            }
            if (showLabels) {
                updateNodeLabel(selectedNode);
            }
        }
        selectedNode = null;
    }
    disableMoveModes();
    removeArrows();
    deselectTextInput();
    setInForm(false);
    insideMenu = false;
}

function deselectTextInput() { //this function is needed to fix problem with typing the 'h' key and hiding
    var inputs = document.getElementsByTagName("input");
    for (i = 0; i < inputs.length; i++) {
        if (inputs[i].getAttribute('type') == "text") {
            inputs[i].blur();
        }
    }
}

/* Called whenever the link menu needs to be turned off */
function toggleLinkMenuOff() {
    if (selectedLink) {
        if (!selectedLink.color) {
            changeLinkColor("White");
        } else {
            changeLinkColor(selectedLink.color);
        }
        //selectedLink.linkMesh.material.linewidth = 1;
    }
    //console.log("toggleLinkMenuOff called");
    if (linkMenuState !== 0) {
        linkMenuState = 0;
        linkMenu.classList.remove(activeClassName);
    }
    setInForm(false);
    selectedLink = null;
    insideMenu = false;
}

function changeNodeColor(color) {
    if (color == "Green") {
        selectedNode.object.material.color.set("rgb(0, 255, 0)");
    }
    else if (color == "Blue") {
        selectedNode.object.material.color.set("rgb(0, 0, 255)");
    }
    else if (color == "Red") {
        selectedNode.object.material.color.set("rgb(255, 0, 0)");
    }
    else if (color == "Orange") {
        selectedNode.object.material.color.set("rgb(255, 102, 0)");
    }
    else if (color == "Yellow") {
        selectedNode.object.material.color.set("rgb(255, 255, 0)");
    }
    else if (color == "Purple") {
        selectedNode.object.material.color.set("rgb(153, 0, 204)");
    }
    else if (color == "White") {
        selectedNode.object.material.color.set(0xffffff);
    }
    else if (color == "Black") {
        selectedNode.object.material.color.set(0x333333);
    }
}

function lookupColor(color) {
    if (color == "Green") {
        return "rgb(0, 255, 0)";
    }
    else if (color == "Blue") {
        return "rgb(0, 0, 255)";
    }
    else if (color == "Red") {
        return "rgb(255, 0, 0)";
    }
    else if (color == "Orange") {
        return "rgb(255, 102, 0)";
    }
    else if (color == "Yellow") {
        return "rgb(255, 255, 0)";
    }
    else if (color == "Purple") {
        return "rgb(153, 0, 204)";
    }
    else if (color == "White") {
        return 0xffffff;
    }
    else if (color == "Black") {
        return 0x333333;
    }
}

function changeLinkColor(color) {
    if (color == "Green") {
        selectedLink.linkMesh.material.color.set("rgb(0, 255, 0)");
    }
    else if (color == "Blue") {
        selectedLink.linkMesh.material.color.set("rgb(0, 0, 255)");
    }
    else if (color == "Red") {
        selectedLink.linkMesh.material.color.set("rgb(255, 0, 0)");
    }
    else if (color == "Orange") {
        selectedLink.linkMesh.material.color.set("rgb(255, 102, 0)");
    }
    else if (color == "Yellow") {
        selectedLink.linkMesh.material.color.set("rgb(255, 255, 0)");
    }
    else if (color == "Purple") {
        selectedLink.linkMesh.material.color.set("rgb(153, 0, 204)");
    }
    else if (color == "White") {
        selectedLink.linkMesh.material.color.set(0xffffff);
    }
    else if (color == "Black") {
        selectedLink.linkMesh.material.color.set(0x333333);
    }
}

//saveSearch is an update "loop" @1000Hz
function saveSearch() {
    /* This function gets called when the save button is pressed after right clicking and editing a node */
    if (nodeMenuSave) {
        var labelExists = true;
        var count = 0;
        selectedNode.nodeDesc = document.getElementById("nodeDesc").value;
        selectedNode.isIonNodeType = document.getElementById("nodeType").checked;
        if (selectedNode.isIonNodeType) { // If ION is checked, then use ion Node num rather than label
            selectedNode.endpointID = document.getElementById("endpointID").value;
            var nl = selectedNode.ionNodeNum;
            for (i = 0; i < nodeMasterList.length; i++) {
                if (selectedNode != nodeMasterList[i]) {
                    if (nl == nodeMasterList[i].endPointID) { // if any of the nodeLabels in the master list are the same as the current . . .
                        //alert("This node number is already being used. This might cause problems when exporting the JSON file.");
                    }
                }
            }
        } else {
            selectedNode.endpointID = document.getElementById("endpointID").value;
            var nl = selectedNode.endpointID;
            for (i = 0; i < nodeMasterList.length; i++) {
                if (selectedNode != nodeMasterList[i]) {
                    if (nl == nodeMasterList[i].endpointID) { // if any of the nodeLabels in the master list are the same as the current . . .
                        //alert("This node ID is already being used. This might cause problems when exporting the JSON file.");
                    }
                }
            }
        }
        //console.log("setting value of isIonNodeType to: " + document.getElementById("nodeType").checked);
        selectedNode.ltp = document.getElementById("ltp").checked;
        selectedNode.udp = document.getElementById("udp").checked;
        selectedNode.tcp = document.getElementById("tcp").checked;
        selectedNode.stcp = document.getElementById("stcp").checked;
        selectedNode.otherProtocol = document.getElementById("otherProtocol").value;
        selectedNode.cfdp = document.getElementById("cfdp").checked;
        selectedNode.ams = document.getElementById("ams").checked;
        selectedNode.otherService = document.getElementById("otherService").value;

        // Change the color of the node
        selectedNode.color = document.getElementById("Color").value;
        changeNodeColor(selectedNode.color);
        selectedNode.object.position.set(document.getElementById("nodeY").value * 10, document.getElementById("nodeZ").value * 10, document.getElementById("nodeX").value * 10);

        var alertUser = false; //check and alert user if there is a duplicate label
        selectedNode.nodeLabel = document.getElementById("nodeLabel").value;
        for (i = 0; i < nodeMasterList.length; i++) {
            if (selectedNode != nodeMasterList[i]) {
                if (selectedNode.nodeLabel == nodeMasterList[i].nodeLabel) { // if any of the nodeLabels in the master list are the same as the current . . .
                    alertUser = true;
                    selectedNode.nodeLabel = "";
                }
            }
        }
        if (alertUser) {
            alert("This node label is already being used. Choose a unique label."); //This might cause problems when exporting the JSON file.");
            selectedNode.object.remove(selectedNode.object.getObjectByName("Label Mesh"));
        } else {
            if (inspectingHost) {
                var selectedHost = getObjectFromLabel(document.getElementById("selectedName").textContent, true);
                var found = false;
                for (i = 0; i < selectedHost.nodes.length; i++) {
                    if (selectedHost.nodes[i] == "") {
                        selectedHost.nodes[i] = selectedNode.nodeLabel;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    selectedHost.nodes.push(selectedNode.nodeLabel);
                }
                selectedNode.host = selectedHost;
                nodePosDict[selectedHost.hostLabel][selectedNode.nodeLabel] = JSON.parse(JSON.stringify(selectedNode.object.position)); //update position in dictionary
            } else {
                for (j = 0; j < hostMasterList.length; j++) {
                    if (hostMasterList[j].nodes.includes(selectedNode.nodeLabel) /*&& selectedNode.object.position.divideScalar(10).equals(new THREE.Vector3(Number(document.getElementById("nodeY").value), Number(document.getElementById("nodeZ").value), Number(document.getElementById("nodeX").value)))*/) {
                        switchEditorNodes(hostMasterList[j]);
                        updateEditorNodes(hostMasterList[j]);
                    }
                }
            }
            
            toggleNodeMenuOff();
        }
        nodeMenuSave = false;
        updateHierarchy();
    }
    if (hostMenuSave) {
        selectedNode.hostDesc = document.getElementById("hostDesc").value;
        selectedNode.color = document.getElementById("hostColor").value;
        selectedNode.platform = getPlatform();
        changeNodeColor(selectedNode.color);
        selectedNode.object.position.set(document.getElementById("hostY").value * 10, document.getElementById("hostZ").value * 10, document.getElementById("hostX").value * 10);
        updateEditorNodes(selectedNode);
        var alertUser = false; //check and alert user if there is a duplicate label
        selectedNode.hostLabel = document.getElementById("hostLabel").value;

        var addressStringArray = document.getElementById("IP").value.replace(/\s/g, "");
        addressStringArray = addressStringArray.split(",");
        selectedNode.address = addressStringArray;

        for (i = 0; i < hostMasterList.length; i++) {
            if (selectedNode != hostMasterList[i]) {
                if (selectedNode.hostLabel == hostMasterList[i].hostLabel) { // if any of the hostLabels in the master list are the same as the current . . .
                    alertUser = true;
                    selectedNode.hostLabel = "";
                }
            }
        }
        if (alertUser) {
            alert("This host label is already being used. Choose a unique label.");
            selectedNode.object.remove(selectedNode.object.getObjectByName("Label Mesh"));
        } else {
            nodePosDict[selectedNode.hostLabel] = {};
            toggleNodeMenuOff();
        }
        hostMenuSave = false;
        updateHierarchy();
    }
    if (linkMenuSave) {
        if (selectedLink.linkMesh.name != "hostLink") {
            selectedLink.symmetric = document.getElementById("symmetric").checked;

            selectedLink.exists12 = document.getElementById("Link Exists12").checked;
            selectedLink.maxRate12 = document.getElementById("Max Rate12").value;
            selectedLink.ltpLayer12 = document.getElementById("LTP Layer12").value;
            selectedLink.bpLayerOtherText12 = document.getElementById("otherBPLayerText12").value;
            selectedLink.description12 = document.getElementById("Description12").value;

            selectedLink.exists21 = document.getElementById("Link Exists21").checked;
            selectedLink.maxRate21 = document.getElementById("Max Rate21").value;
            selectedLink.ltpLayer21 = document.getElementById("LTP Layer21").value;
            selectedLink.bpLayerOtherText21 = document.getElementById("otherBPLayerText21").value;
            selectedLink.description21 = document.getElementById("Description21").value;

            //checkContactFormat(selectedLink);

            selectedLink.tcp12 = document.getElementById("TCP12").checked;
            selectedLink.ltp12 = document.getElementById("LTP12").checked;
            selectedLink.udp12 = document.getElementById("UDP12").checked;
            selectedLink.stcp12 = document.getElementById("STCP12").checked;
            selectedLink.dccp12 = document.getElementById("DCCP12").checked;
            selectedLink.bpLayerOther12 = document.getElementById("otherBPLayer12").checked;

            selectedLink.tcp21 = document.getElementById("TCP21").checked;
            selectedLink.ltp21 = document.getElementById("LTP21").checked;
            selectedLink.udp21 = document.getElementById("UDP21").checked;
            selectedLink.stcp21 = document.getElementById("STCP21").checked;
            selectedLink.dccp21 = document.getElementById("DCCP21").checked;
            selectedLink.bpLayerOther21 = document.getElementById("otherBPLayer21").checked;

            if (document.getElementById("Link Color").value != "" || selectedLink.exists12 || selectedLink.exists21) {
                selectedLink.color = document.getElementById("Link Color").value;
            }
            if (!selectedLink.exists12 && !selectedLink.exists21 && document.getElementById("Link Color").value == "") {
                selectedLink.color = "White";
            }
            changeLinkColor(selectedLink.color);
            if (selectedLink.symmetric) {
                selectedLink.exists12 = true;
                selectedLink.exists21 = true;
            }
        } else {
            selectedLink.color = document.getElementById("Link Color").value;
            changeLinkColor(selectedLink.color);
        }
        toggleLinkMenuOff();
        linkMenuSave = false;
    }
    setTimeout(saveSearch, 1);
}
saveSearch();

function checkContactFormat(link) {
    var format1 = /^\d{1,4}\/\d{1,2}\/\d{1,2}-\d{1,2}:\d{1,2}:\d{1,2}$/;
    var format2 = /^\+\d+$/;
    var alertb = false;
    var str1 = document.getElementById("startTime12").value;
    var str2 = document.getElementById("endTime12").value;
    if (format1.test(str1) || format2.test(str1) || str1 == "") {
        link.startTime12 = document.getElementById("startTime12").value;
    } else {
        alertb = true;
        link.startTime12 = "";
    }
    if (format1.test(str2) || format2.test(str2) || str2 == "") {
        link.endTime12 = document.getElementById("endTime12").value;
    } else {
        alertb = true;
        link.endTime12 = "";
    }

    var str1 = document.getElementById("startTime21").value;
    var str2 = document.getElementById("endTime21").value;
    if (format1.test(str1) || format2.test(str1) || str1 == "") {
        link.startTime21 = document.getElementById("startTime21").value;
    } else {
        alertb = true;
        link.startTime21 = "";
    }
    if (format1.test(str2) || format2.test(str2) || str2 == "") {
        link.endTime21 = document.getElementById("endTime21").value;
    } else {
        alertb = true;
        link.endTime21 = "";
    }
    if (alertb) alert("Start or end time is incorrectly formatted.");
}

/* This function is called whenever the Delete Node button on the node editor is pressed.
 * This should also remove all links that correspond to the deleted node. */
function removeNode() {
    var host = selectedNode.host;
    if (host) { //node has a host
        for (i = 0; i < host.nodes.length; i++) {
            if (host.nodes[i] == selectedNode.nodeLabel) {
                host.nodes.splice(i, 1);
                break;
            }
        }
        switchEditorNodes(host)
        updateEditorNodes(host);
        if (showLabels) {
            updateHostLabel(host);
        }
    }
    for (i = 0; i < nodeMasterList.length; i++) {
        if (nodeMasterList[i] == selectedNode) {
            if (host) {
                delete nodePosDict[host.hostLabel][nodeMasterList[i].nodeLabel];
            }
            nodeMasterList.splice(i, 1);
            scene.remove(selectedNode.object);
            break;
        }
    }
    var linksToDelete = [];
    for (i = 0; i < linkMasterList.length; i++) {
        if (linkMasterList[i].Node1 == selectedNode || linkMasterList[i].Node2 == selectedNode) {
            scene.remove(linkMasterList[i].linkMesh);
            linksToDelete.push(linkMasterList[i]);
            if (!linkMasterList[i].Node1.host || !linkMasterList[i].Node2.host) continue;
            var key = linkMasterList[i].Node1.host.hostLabel + linkMasterList[i].Node2.host.hostLabel;
            if (key in hostLinkMasterList) {
                var create = false;
                var temp = linkMasterList.length;
                for (var j = 0; j < temp; j++) {
                    if ((linkMasterList[j].Node1.host != linkMasterList[j].Node2.host)
                        && !linksToDelete.includes(linkMasterList[j])
                        && (linkMasterList[j].Node1.host == linkMasterList[i].Node1.host)
                        && (linkMasterList[j].Node2.host == linkMasterList[i].Node2.host)
                    ) {
                        create = true;  
                    }
                }
                if (!create) {
                    scene.remove(hostLinkMasterList[key].linkMesh);
                    delete hostLinkMasterList[key];
                    //linksToDelete.push(linkMasterList[i]);
                }
            }
        }
    }
    linkMasterList = linkMasterList.filter(x => !linksToDelete.includes(x));
    toggleNodeMenuOff();
    updateHierarchy();
    return false;
}

function removeHost() {
    for (i = 0; i < nodeMasterList.length; i++) {
        if (nodeMasterList[i].host === selectedNode) {
            nodeMasterList[i].host = null;
        }
    }
    for (i = 0; i < linkMasterList.length; i++) {
        if (linkMasterList[i].Node1.host === selectedNode) {
            linkMasterList[i].Node1.host = null;
        }
        if (linkMasterList[i].Node2.host === selectedNode) {
            linkMasterList[i].Node2.host = null;
        }
    }
    for (var key in hostLinkMasterList) { //if host has a link, delete it
        var link = hostLinkMasterList[key];
        if (link.Node1 === selectedNode || link.Node2 === selectedNode) {
            delete hostLinkMasterList[key];
            removeLink(link);
        }
    }
    for (i = 0; i < hostMasterList.length; i++) {
        if (hostMasterList[i] === selectedNode) {
            delete nodePosDict[hostMasterList[i].hostLabel];
            hostMasterList.splice(i, 1);
            scene.remove(selectedNode.object);
            break;
        }
    }
    toggleNodeMenuOff();
    updateHierarchy();
    return false;
}

/* This function is called whenver the Delete Link button in the link editor is pressed */
function removeLink(link) {
    var linksToDelete = [];
    for (i = 0; i < linkMasterList.length; i++) {
        if (linkMasterList[i] == link) {
            scene.remove(link.linkMesh);
            linksToDelete.push(linkMasterList[i]);
        }
    }
    linkMasterList = linkMasterList.filter(x => !linksToDelete.includes(x));
    toggleLinkMenuOff();
    link = null;
    return false;
}

function removeArrows() {
    if (arrows) {
        while (scene2.children.length > 0) {
            scene2.remove(scene2.children[0]);
        }
        arrows = null;
    }
}

//this function is called when the 'X' button is clicked in the host editor menu
function deleteNodeFromHost(event) {
    var index = Number(event.target.id) - 1;
    var textBoxes = document.getElementById("nodeList").getElementsByTagName("input");
    var buttons = document.getElementById("nodeList").getElementsByTagName("button");
    for (i = index + 1; i < buttons.length; i++) {
        var newID = Number(buttons[i].getAttribute("id")) - 1;
        buttons[i].setAttribute("id", newID.toString());
    }
    document.getElementById("nodeList").removeChild(event.target);
    document.getElementById("nodeList").removeChild(textBoxes[index]);
    var node = getObjectFromLabel(selectedNode.nodes[index]);

    for (i = 0; i < linkMasterList.length; i++) { //remove hostLinks if necessary
        if (linkMasterList[i].Node1 == node || linkMasterList[i].Node2 == node) { //only look at links for the node being removed
            if (!linkMasterList[i].Node1.host || !linkMasterList[i].Node2.host) continue;
            var key = linkMasterList[i].Node1.host.hostLabel + linkMasterList[i].Node2.host.hostLabel;
            if (key in hostLinkMasterList) {
                var create = false;
                for (var j = 0; j < linkMasterList.length; j++) {
                    if ((linkMasterList[j].Node1.host != linkMasterList[j].Node2.host) //try to find link that connects the two hosts besides the one connected to the node getting removed
                        && (linkMasterList[j].Node1.host == linkMasterList[i].Node1.host)
                        && (linkMasterList[j].Node2.host == linkMasterList[i].Node2.host)
                        && linkMasterList[i] != linkMasterList[j]
                        //&& linkMasterList[i].Node1 != node && linkMasterList[i].Node2 != node
                        && linkMasterList[j].Node1 != node && linkMasterList[j].Node2 != node
                    ) {
                        create = true;
                    }
                }
                if (!create) {
                    scene.remove(hostLinkMasterList[key].linkMesh);
                    delete hostLinkMasterList[key];
                }
            }
        }
    }

    if (selectedNode.nodes[index] != "") {
        node.host = null; //set node's host to null
    }
    selectedNode.nodes.splice(index, 1); //remove node from host's list of nodes
    var amt = Number(document.getElementById("numOfNodes").value) - 1;
    document.getElementById("numOfNodes").value = amt.toString();
    if (document.getElementById("nodeList").getElementsByTagName("input").length == 0) {
        document.getElementById("nodeList").removeChild(document.getElementById("nodeLabels"));
    }
    updateEditorNodes(selectedNode);
    if (showLabels) {
        updateHostLabel(selectedNode);
    }
}

// This is called when the user toggles between ion or dtn in the node editor.
function toggleIONorDTN() {
    selectedNode.isIonNodeType = document.getElementById("nodeType").checked;
    if (selectedNode.isIonNodeType) {
        // Change Node Label to Node ID
        document.getElementById("nodeLabelInnerText").innerText = "ION Node Number:"
    } else {
        // Change Node Label to ION Node Num
        document.getElementById("nodeLabelInnerText").innerText = "Node ID:"
    }
    document.getElementById("endpointID").value = selectedNode.endpointID;
}

function getPlatform() {
    if (document.getElementById("Windows").checked) {
        return 'windows';
    } else if (document.getElementById("Unix").checked) {
        return 'unix';
    } else if (document.getElementById("Mac").checked) {
        return 'mac';
    } else if (document.getElementById("otherPlatform").checked) {
        return document.getElementById("otherPlatformText").value;
    }
}

// This is called when the symmetric button in the link editor is clicked
function toggleSymmetric() {
    if (selectedLink) {
        selectedLink.symmetric = document.getElementById("symmetric").checked;
        var nodeLabel1 = selectedLink.Node1.nodeLabel;
        var nodeLabel2 = selectedLink.Node2.nodeLabel;
        if (nodeLabel1 == "") { nodeLabel1 = "?"; }
        if (nodeLabel2 == "") { nodeLabel2 = "?"; }
        if (selectedLink.symmetric) {
            // Hide one of the columns
            document.getElementById("menu-column-right").style.visibility = "hidden";
            // Change the header text

            var newHeader = "Link Between " + nodeLabel1 + " and " + nodeLabel2;
            document.getElementById("Node 1 to 2 Column").innerText = newHeader;
            document.getElementById("menu-column-right").style.width = "10px";
            document.getElementById("menu-column-right").style.height = "10px";
            document.getElementById("link-menu").style.width = "300px";
            selectedLink.exists12 = true;
            selectedLink.exists21 = true;
            document.getElementById("Link Exists12").checked = true;
            document.getElementById("Link Exists21").checked = true;
            // Change the values of the left side to match the values of the right side
            makeAttributesSymmetric();
            toggleLink12();
            toggleLink21();
        }
        else {
            document.getElementById("menu-column-right").style.visibility = "visible";
            document.getElementById("menu-column-right").style.width = "auto";
            document.getElementById("menu-column-right").style.height = "auto";
            document.getElementById("link-menu").style.width = "auto";
            document.getElementById("Node 1 to 2 Column").innerText = nodeLabel1 + "-to-" + nodeLabel2;
            if (selectedLink.exists21) {
                document.getElementById("Attributes21").style.visibility = "visible";
            }
        }
    }

}

function makeAttributesSymmetric() {
    if (selectedLink.maxRate12 != selectedLink.maxRate21) {
        if (selectedLink.maxRate12 == 0) {
            selectedLink.maxRate12 = selectedLink.maxRate21;
        }
    }
    if (selectedLink.tcp12 != selectedLink.tcp21) {
        selectedLink.tcp21 = selectedLink.tcp12;
    }
    if (selectedLink.ltp12 != selectedLink.ltp21) {
        selectedLink.ltp21 = selectedLink.ltp12;
    }
    if (selectedLink.bpLayerOther12 != selectedLink.bpLayerOther21) {
        selectedLink.bpLayerOther21 = selectedLink.bpLayerOther12;
    }
    if (selectedLink.bpLayerOtherText12 != selectedLink.bpLayerOtherText21) {
        if (selectedLink.bpLayerOtherText12 == "")
            selectedLink.bpLayerOtherText12 = selectedLink.bpLayerOtherText21;
    }
    if (selectedLink.ltpLayer12 != selectedLink.ltpLayer21) {
        if (selectedLink.ltpLayer12 == "")
            selectedLink.ltpLayer12 = selectedLink.ltpLayer21;
    }
    updateLinkDOMElements();

}

function toggleLink12() {
    selectedLink.exists12 = document.getElementById("Link Exists12").checked;
    if (selectedLink.exists12) {
        //show everyting below it
        document.getElementById("Attributes12").style.visibility = "visible";

    }
    else {
        //hide everything below it
        document.getElementById("Attributes12").style.visibility = "hidden";
    }
}

function toggleLink21() {
    selectedLink.exists21 = document.getElementById("Link Exists21").checked;
    if (selectedLink.exists21) {
        if (!selectedLink.symmetric) {
            //show everyting below it
            document.getElementById("Attributes21").style.visibility = "visible";
        }
        else {
            document.getElementById("Attributes21").style.visibility = "hidden";
        }


    }
    else {
        //hide everything below it
        document.getElementById("Attributes21").style.visibility = "hidden";
    }
}

function toggleHostLinkMenu(enable) { //this hides all extra link information except for the color
    if (enable) {
        document.getElementById("symmetric").style.display = "none";
        document.getElementById("symmetricTitle").style.display = "none";
        document.getElementById("menu-column-left").style.display = "none";
        document.getElementById("menu-column-right").style.display = "none";
    } else {
        document.getElementById("symmetric").style.display = "inline-block";
        document.getElementById("symmetricTitle").style.display = "inline-block";
        document.getElementById("menu-column-left").style.display = "inline-block";
        document.getElementById("menu-column-right").style.display = "inline-block";
    }
}
