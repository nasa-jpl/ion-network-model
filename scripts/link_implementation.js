/* This script will implement link creation between nodes */

var linkMode; // boolean set to true when a node is shift clicked on
var shiftDown; // set to true when the shift button is pressed
var nodeClicked; // set to true when the mouse goes down on a node
var srcNode, destNode;

/* This function is called when the shift key is pressed 
   This function is used for pressing shift key and then clicking the node */
function linkStartupShift(startNode) {
    // if a node is clicked on as well
    if (nodeClicked) {
        if (startNode != null && startNode.name == "Node") { //check if it is actually a node
            srcNode = startNode; // set srcNode
            linkMode = true;
        }
    }

}

/* This function is called when the mouse is down on a node 
   This function is used for clicking on node and then pressing the shift key */
function linkStartupClick(startNode) {
    nodeClicked = true;
    if (shiftDown) {
        if (startNode != null && startNode.name == "Node") { // check if it is actually a node
            srcNode = startNode;
            linkMode = true;
        }
    }
}



// when a node is shift clicked on, it it should be stored in srcNode

//Then every frame the mouse Position should be tracked and the line from the srcNode to the mouse should be updated

// If the mouse button is released off of a node, srcNode should be emptied.

// If the mouse button is released on a node (that is not the srcNode), then make that node the destNode, and connect them with a permament link. 

/* This is an update function that gets called every frame
   Use this function to draw the line by updating it  */
function linkUpdate(mousePos) {
    if (linkMode) { // If we are in the process of making a link
        // Draw the line between source and mouse 
        controls.enabled = false;
        if (srcNode) {
            var mouseVector = new THREE.Vector3(mousePos.x, mousePos.y, -1).unproject(camera);
            drawLine(srcNode.position, mouseVector);
        }
    }
    updateLinkPositions();
}


/* This function will be called when the mouse is released on a node or when shift is released
   All other cases should be handled here */
function linkEnd(endNode) {
    nodeClicked = false;
    if (linkMode) { // If we are actually in the process of implementing a link
        if (endNode && endNode.object != srcNode && endNode.object.name == "Node") { // If our destNode is actually different from our srcNode and is a node
            destNode = endNode.object;
            createLink(srcNode, destNode);
        }
        linkMode = false;
    }

    controls.enabled = true;
    deleteLine();

}

function drawLine(p1, p2) {
    var mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3.0 });
    var geo = new THREE.Geometry();
    geo.vertices.push(p1, p2);
    var line = new THREE.Line(geo, mat);
    line.name = "Line";
    deleteLine();
    scene.add(line);
    return line;
}

function deleteLine() {
    oldLineObject = scene.getObjectByName("Line");
    if (oldLineObject) {
        scene.remove(oldLineObject);
    }
}


function createLink(startNode, endNode) {
    var mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3.0 });
    var geo = new THREE.Geometry();
    geo.vertices.push(startNode.position, endNode.position);
    var linkMesh = new THREE.Line(geo, mat);
    linkMesh.name = "Link";
    scene.add(linkMesh);
    var link = new Link();
    link.Node1 = getObject(startNode);
    link.Node2 = getObject(endNode);
    link.linkMesh = linkMesh;
    linkMasterList.push(link);
    return link;
}

function createHostLink(startHost, endHost, color = 0xffffff) {
    var mat = new THREE.LineBasicMaterial({ color: lookupColor(color), linewidth: 3.0 });
    var geo = new THREE.Geometry();
    geo.vertices.push(startHost.position, endHost.position);
    var linkMesh = new THREE.Line(geo, mat);
    linkMesh.name = "hostLink";
    scene.add(linkMesh);
    var link = new hostLink();
    link.Node1 = getObject(startHost);
    link.Node2 = getObject(endHost);
    link.color = color;
    link.linkMesh = linkMesh;
    linkMasterList.push(link);
    return link;
}

function updateLinkPositions() {
    for (i = 0; i < linkMasterList.length; i++) {
        linkMasterList[i].linkMesh.geometry.vertices = [linkMasterList[i].Node1.object.position, linkMasterList[i].Node2.object.position];
        linkMasterList[i].linkMesh.geometry.verticesNeedUpdate = true;
        linkMasterList[i].linkMesh.geometry.computeBoundingSphere();
    }
}

function updateLinkPosition(link) {
    link.linkMesh.geometry.vertices = [link.Node1.object.position, link.node2.object.position];
    link.linkMesh.geometry.verticesNeedUpdate = true;
}