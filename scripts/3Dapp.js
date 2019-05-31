
render();

/****************************************************************************************/
/*-------------------------------UPDATE FUNCTIONS-----------------------------------------
/****************************************************************************************/

// Renders the scene and updates the renderer as needed.
function render() {
    // Read more about requestAnimationFrame at http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
    requestAnimationFrame(render);
    // Render the scene.
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(scene2, camera);
    controls.update();

    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // calculates the object intersecting the ray
    var intersections = raycaster.intersectObjects(scene.children, false);
    if (intersections.length > 0) {
        for (i = 0; i < intersections.length; i++) {
            if (intersections[i].object.name == "Link" || intersections[i].object.name == "hostLink" ) {
                intersect = intersections[i];
                break;
            }
            if (intersections[i].object.name == "Ground") {
                intersect = intersections[i];
                addLoc = intersections[i].point;
                break;
            }
            if (intersections[i].object.name != "helperPlane" && intersections[i].object.name != "pointer") {
                intersect = intersections[i];
                break;
            }
        }
        // set the cursor ball to the raycast hit location
        if (intersect) {
            var point = intersect.point;
            var cursorLoc = new THREE.Vector3(point.x, point.y, point.z);
            pointer.position.set(cursorLoc.x, cursorLoc.y, cursorLoc.z);
        }
    }
    //updateIntersect();
    if (selection) {
        if (moveMode) { // when node is clicked and pressed g or m on, call function until becomes false
            dragNode(selection);
            document.getElementById("nodeX").value = selectedNode.object.position.z / 10;
            document.getElementById("nodeY").value = selectedNode.object.position.x / 10;
            document.getElementById("nodeZ").value = selectedNode.object.position.y / 10;
            document.getElementById("hostX").value = selectedNode.object.position.z / 10;
            document.getElementById("hostY").value = selectedNode.object.position.x / 10;
            document.getElementById("hostZ").value = selectedNode.object.position.y / 10;
        }
        else if (moveModeZ) {
            dragNodeZ(selection);
        }
        else if (moveModeX) {
            dragNodeX(selection);
        }
        else if (moveModeY) {
            dragNodeY(selection);
        }
        if (selection.name == "yArrow") {
            xArrow = arrows[1];
            zArrow = arrows[0];
            xArrow.position.set(selection.position.x, selection.position.y, selection.position.z);
            zArrow.position.set(selection.position.x, selection.position.y, selection.position.z);
            latestNode.position.set(selection.position.x, selection.position.y, selection.position.z);
            if (inspectingHost && latestNode.name == "Node") {
                var hostLabel = document.getElementById("selectedName").textContent;
                var nodeLabel = getObject(latestNode).nodeLabel;
                if (nodeLabel != "") {
                    nodePosDict[hostLabel][nodeLabel] = JSON.parse(JSON.stringify(latestNode.position)); //assign by value
                }
            }
            document.getElementById("nodeY").value = selectedNode.object.position.x / 10;
            document.getElementById("hostY").value = selectedNode.object.position.x / 10;
        } else if (selection.name == "xArrow") {
            yArrow = arrows[2];
            zArrow = arrows[0];
            yArrow.position.set(selection.position.x, selection.position.y, selection.position.z);
            zArrow.position.set(selection.position.x, selection.position.y, selection.position.z);
            latestNode.position.set(selection.position.x, selection.position.y, selection.position.z);
            if (inspectingHost && latestNode.name == "Node") {
                var hostLabel = document.getElementById("selectedName").textContent;
                var nodeLabel = getObject(latestNode).nodeLabel;
                if (nodeLabel != "") {
                    nodePosDict[hostLabel][nodeLabel] = JSON.parse(JSON.stringify(latestNode.position)); //assign by value
                }
            }
            document.getElementById("nodeX").value = selectedNode.object.position.z / 10;
            document.getElementById("hostX").value = selectedNode.object.position.z / 10;
        } else if (selection.name == "zArrow") {
            xArrow = arrows[1];
            yArrow = arrows[2];
            xArrow.position.set(selection.position.x, selection.position.y, selection.position.z);
            yArrow.position.set(selection.position.x, selection.position.y, selection.position.z);
            latestNode.position.set(selection.position.x, selection.position.y, selection.position.z);
            if (inspectingHost && latestNode.name == "Node") {
                var hostLabel = document.getElementById("selectedName").textContent;
                var nodeLabel = getObject(latestNode).nodeLabel;
                if (nodeLabel != "") {
                    nodePosDict[hostLabel][nodeLabel] = JSON.parse(JSON.stringify(latestNode.position)); //assign by value
                }
            }
            document.getElementById("nodeZ").value = selectedNode.object.position.y / 10;
            document.getElementById("hostZ").value = selectedNode.object.position.y / 10;
        }
    }

    for (var i = 0; i < nodeMasterList.length; i++) {
        var lm = nodeMasterList[i].object.getObjectByName("Label Mesh");
        if (lm) {
            lm.lookAt(camera.position);
        }
    }

    // call link update so link_implementation has an update
    linkUpdate(mouse);

}

/* This function should be called every frame when the 'g'
or the 'm' keys were pressed down with the cursor on it 
-Called when dragNode is true
*/
function dragNodeZ(node) {
    // moving the mouse should also move the node
    //node.translateY(deltaMouseY * dragSensitivity);
    // moving the mouse should also move the node
    var intersectPlane = raycaster.intersectObject(plane);
    if (intersectPlane.length > 0) {
        node.position.copy(new THREE.Vector3(node.position.x, intersectPlane[0].point.sub(offset).y, node.position.z));
    }
}

function dragNodeX(node) {
    var intersectPlane = raycaster.intersectObject(plane);
    if (intersectPlane.length > 0) {
        node.position.copy(new THREE.Vector3(node.position.x, node.position.y, intersectPlane[0].point.sub(offset).z));
    }
}

function dragNodeY(node) {
    var intersectPlane = raycaster.intersectObject(plane);
    if (intersectPlane.length > 0) {
        node.position.copy(new THREE.Vector3(intersectPlane[0].point.sub(offset).x, node.position.y, node.position.z));
    }
}

function dragNode(node) {
    var intersectPlane = raycaster.intersectObject(plane);
    if (intersectPlane.length > 0) {
        node.position.copy(intersectPlane[0].point.sub(offset));
    }
}

/****************************************************************************************/
//-------------------------------CALLED FUNCTIONS-----------------------------------------
/****************************************************************************************/

/*  These functions gets called when the a button is pressed. This takes the position of where the 'a' key was pressed and creates the node or host
*/
function placeNode() {
    if (addLoc != null) {
        var nodeLoc = new THREE.Vector3(addLoc.x, addLoc.y + 2.5, addLoc.z);
        scene.add(generateNewNode(nodeLoc));
    }
    updateHierarchy();
    toggleAddMenu(false);
}

function placeHost() {
    if (addLoc != null) {
        //var hostLoc = new THREE.Vector3(addLoc.x, addLoc.y + 2.5, addLoc.z);
        var hostLoc = new THREE.Vector3(addLoc.x, addLoc.y + 0.833, addLoc.z);
        scene.add(generateNewHost(hostLoc));
    }
    updateHierarchy();
    toggleAddMenu(false);
}

//This function returns the object that the raycaster is hitting 
function mouseIntersectsWith() {
    var intersections = raycaster.intersectObjects(scene.children, false);
    if (intersections.length > 0) {
        intersect = intersections[0];
        // ignore the pointer
        if (intersections[0].object.name == "pointer") {
            if (intersections[1] != null) {
                intersect = intersections[1];
                return intersect.object;
            }
            else {
                return null;
            }
        }
    }
    else {
        return null; // return null if no intersecting objects
    }
}

/* This function just updates the intersect variable */
function updateIntersect() {
    var intersections = raycaster.intersectObjects(scene.children, true);
    var arrowIntersections = raycaster.intersectObjects(scene2.children, true);
    for (i = 0; i < arrowIntersections.length; i++) {
        if (arrowIntersections[i].object.name == "yArrow" || arrowIntersections[i].object.name == "xArrow" || arrowIntersections[i].object.name == "zArrow") {
            intersect = arrowIntersections[i];
            return;
        }
    }
    for (i = 0; i < intersections.length; i++) {
        if (intersections[i].object.name == "Node" || intersections[i].object.name == "Host" || intersections[i].object.name == "Link" || intersections[i].object.name == "hostLink") {
            intersect = intersections[i];
            return;
        }
    }
    intersect = null;
}

/* This function updates the physical node label. This is called when the 
   save button on the node menu is pressed */
function updateNodeLabel(node) {
    if (!node) {
        return;
    }
    if (node.labelMesh && node.labelMesh.geometry.text == node.nodeLabel &&
       ((node.IDMesh.geometry.parameters.text == "ipn:" + node.endpointID && node.isIonNodeType) ||
       (node.IDMesh.geometry.parameters.text == "dtn://" + node.endpointID && !node.isIonNodeType))) { //if there is nothing to update, don't
        return;
    }
    node.object.remove(node.object.getObjectByName("Label Mesh"));
    if (node.nodeLabel != "") {
        // Generate text title for the node
        var loader = new THREE.FontLoader();
        loader.load('helvetiker_bold.typeface.json', function (font) {
            var nodeLabel = new THREE.TextGeometry(node.nodeLabel, {
                font: font,
                size: 2,
                height: .2,
                curveSegments: 12,
                bevelEnabled: false,
                bevelThickness: 10,
                bevelSize: 8,
                bevelSegments: 5
            });
            nodeLabel.text = node.nodeLabel;
            nodeLabel.center();
            var nodeIDText;
            if (node.isIonNodeType) { nodeIDText = "ipn:" + node.endpointID; }
            else { nodeIDText = "dtn://" + node.endpointID; }
            var nodeID = new THREE.TextGeometry(nodeIDText, {
                font: font,
                size: 1,
                height: .2,
                curveSegments: 12,
                bevelEnabled: false,
                bevelThickness: 10,
                bevelSize: 8,
                bevelSegments: 5
            });
            nodeID.center();
            var textMaterial = new THREE.MeshBasicMaterial({ color: "rgb(255, 0, 0)" });
            var labelMesh = new THREE.Mesh(nodeLabel, textMaterial);
            var nodeIDMesh = new THREE.Mesh(nodeID, textMaterial);
            labelMesh.name = "Label Mesh";
            nodeIDMesh.name = "ID Mesh";
            //Add wireframe to the label
            var geo = new THREE.EdgesGeometry(labelMesh.geometry);
            var mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
            var wireframe = new THREE.LineSegments(geo, mat);
            labelMesh.add(wireframe);
            //add wireframe to the id
            var geo = new THREE.EdgesGeometry(nodeIDMesh.geometry);
            var mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
            var wireframe = new THREE.LineSegments(geo, mat);
            nodeIDMesh.add(wireframe);
            nodeIDMesh.position.set(0, -1.9, 0);
            labelMesh.add(nodeIDMesh);
            node.object.add(labelMesh);
            labelMesh.position.set(0, 5.2, 0);
            node.labelMesh = labelMesh;
            node.IDMesh = nodeIDMesh;
        });
    }
}

function updateHostLabel(host) {
    if (!host) {
        return;
    }
    var lm = host.object.getObjectByName("Label Mesh");
    if (host.nodes.length == 0) {
        if (lm && lm.geometry.text == host.hostLabel && lm.scale.equals(new THREE.Vector3(1, 1, 1))) {
            return;
        }
    } else {
        if (lm && lm.geometry.text == host.hostLabel && lm.scale.equals(new THREE.Vector3(1 / host.nodes.length, 1, 1))) {
            return;
        }
    }
    host.object.remove(host.object.getObjectByName("Label Mesh"));
    if (host.hostLabel != "") {
        // Generate text title for the node
        var loader = new THREE.FontLoader();
        loader.load('helvetiker_bold.typeface.json', function (font) {
            var hostLabel = new THREE.TextGeometry(host.hostLabel, {
                font: font,
                size: 2,
                height: .2,
                curveSegments: 12,
                bevelEnabled: false,
                bevelThickness: 10,
                bevelSize: 8,
                bevelSegments: 5
            });
            hostLabel.text = host.hostLabel;
            hostLabel.center();
            var textMaterial = new THREE.MeshBasicMaterial({ color: "rgb(255, 0, 0)" });
            var labelMesh = new THREE.Mesh(hostLabel, textMaterial);
            labelMesh.name = "Label Mesh";
            //Add wireframe to the label
            var geo = new THREE.EdgesGeometry(labelMesh.geometry);
            var mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
            var wireframe = new THREE.LineSegments(geo, mat);
            labelMesh.add(wireframe);
            host.object.add(labelMesh);
            labelMesh.position.set(0, 0, 2.6);
            if (host.nodes.length == 0) {
                labelMesh.scale.set(1, 1, 1);
            } else {
                labelMesh.scale.set(1 / host.nodes.length, 1, 1);
            }
            //labelMesh.lookAt(camera.position);
            host.labelMesh = labelMesh;
        });
    }
}

function setViewState(state) {
    viewMode = state;
    toggleAddMenu(false);
    switch (state) {
        case 0: // view everything
            unhide();
            if (inspectingHost) {
                var host = getObjectFromLabel(document.getElementById("selectedName").textContent, true);
                inspectingHost = false;
                switchEditorNodes(host);
                updateEditorNodes(host);
                if (showLabels) {
                    updateHostLabel(host);
                }
            }
            document.getElementById("selectedName").textContent = "";
            break;
        case 1: // view nodes only
            unhide();
            if (inspectingHost) {
                var host = getObjectFromLabel(document.getElementById("selectedName").textContent, true);
                switchEditorNodes(host);
                inspectingHost = false;
                updateEditorNodes(host);
                if (showLabels) {
                    updateHostLabel(host);
                }
            }
            document.getElementById("selectedName").textContent = "";
            for (var i = 0; i < hostMasterList.length; i++) {
                hide(hostMasterList[i]);
            }
            removeArrows();
            break;
        case 2: // view hosts only
            unhide();
            if (inspectingHost) {
                var host = getObjectFromLabel(document.getElementById("selectedName").textContent, true);
                switchEditorNodes(host);
                inspectingHost = false;
                updateEditorNodes(host);
                if (showLabels) {
                    updateHostLabel(host);
                }
            }
            document.getElementById("selectedName").textContent = "";
            for (var i = 0; i < nodeMasterList.length; i++) {
                hide(nodeMasterList[i]);
            }
            //create links between hosts if there is at least one node connection
            var temp = linkMasterList.length;
            for (var i = 0; i < temp; i++) {
                if (!linkMasterList[i].Node1.host || !linkMasterList[i].Node2.host) continue;
                if (linkMasterList[i].Node2.host.hostLabel + linkMasterList[i].Node1.host.hostLabel in hostLinkMasterList) continue;
                if (linkMasterList[i].Node1.host != linkMasterList[i].Node2.host) {
                    if (!(linkMasterList[i].Node1.host.hostLabel + linkMasterList[i].Node2.host.hostLabel in hostLinkMasterList)) {
                        hostLinkMasterList[linkMasterList[i].Node1.host.hostLabel + linkMasterList[i].Node2.host.hostLabel] = createHostLink(linkMasterList[i].Node1.host.object, linkMasterList[i].Node2.host.object);
                    } else if (hostLinkMasterList[linkMasterList[i].Node1.host.hostLabel + linkMasterList[i].Node2.host.hostLabel].linkMesh == null) {
                        hostLinkMasterList[linkMasterList[i].Node1.host.hostLabel + linkMasterList[i].Node2.host.hostLabel] = createHostLink(linkMasterList[i].Node1.host.object, linkMasterList[i].Node2.host.object, hostLinkMasterList[linkMasterList[i].Node1.host.hostLabel + linkMasterList[i].Node2.host.hostLabel].color);
                    }
                    hostLinkMasterList[linkMasterList[i].Node1.host.hostLabel + linkMasterList[i].Node2.host.hostLabel].linkMesh.material.visible = true;
                }
            }
            removeArrows();
            break;
        case 3: //view specific host
            unhide();
            if (selectedNode.hostLabel == "") {
                alert("Please give the selected Host a label.");
                hideAllMenus();
                //setViewState(0);
                return;
            }
            inspectingHost = true;
            document.getElementById("selectedName").textContent = selectedNode.hostLabel;
            for (var i = 0; i < hostMasterList.length; i++) { //hide all hosts
                hide(hostMasterList[i]);
            }
            for (var i = 0; i < nodeMasterList.length; i++) { //hide all unnecessary nodes
                var check = false;
                for (var j = 0; j < selectedNode.nodes.length; j++) {
                    if (selectedNode.nodes[j] == nodeMasterList[i].nodeLabel && nodeMasterList[i].nodeLabel != "") {
                        var vector = nodePosDict[selectedNode.hostLabel][nodeMasterList[i].nodeLabel];
                        if (vector != null) {
                            nodeMasterList[i].object.position.set(vector.x, vector.y, vector.z);
                        }
                        check = true;
                    }
                }
                if (!check) {
                    hide(nodeMasterList[i]);
                }
            }
            removeArrows();
            break;
    }
}

/*-------------------------------EVENT LISTENERS------------------------------------------
****************************************************************************************/
var canvas = document.getElementsByTagName("canvas")[0];

// This is the button press handler. 
window.addEventListener('keydown', onKeyDown);

// Button release handler
window.addEventListener('keyup', onKeyUp);

// call the mouse move function on mouse move 
canvas.addEventListener('mousemove', onMouseMove);

canvas.addEventListener("mousedown", onMouseDown);

canvas.addEventListener('mouseup', onMouseUp);
/****************************************************************************************/


/*-------------------------------EVENT-CALLED FUNCTIONS--------------------------------
****************************************************************************************/

/* Called when a key is pressed down */
function onKeyDown(event) {
    // when 'a' is pressed, add node to scene
    if (event.keyCode == 65) {
        var intersections = raycaster.intersectObjects(scene.children, false);
        if (intersections.length > 0) {
            for (i = 0; i < intersections.length; i++) {
                if (intersections[i].object.name == "Ground") {
                    addLoc = intersections[i].point;
                    break;
                }
            }
        }
        if (!insideMenu) {
            toggleAddMenu(true);
            //placeNode();
        }
    }

    if (event.keyCode == 68 && !isDuplicating && !isInForm) { //when 'd' is pressed
        isDuplicating = true;
        if (selectedNode && shiftDown) {
            selectedNode.object.material.opacity = 1;
            if (selectedNode.object.name == "Host") {
                selectedNode = duplicateHost(selectedNode);
            } else {
                selectedNode = duplicateNode(selectedNode);
            }
            updateHierarchy();
            selection = selectedNode.object;
            latestNode = selectedNode.object;
            toggleNodeMenuOn();
        }
    }

    if (selectedNode && event.keyCode == 82 && selectedNode.object.name == "Host" && !isInForm) { //when 'r' is pressed
        selectedNode.object.rotation.y += Math.PI / 2;
        if (selectedNode.object.rotation.y >= Math.PI * 2) {
            selectedNode.object.rotation.y = 0;
        }
        updateEditorNodes(selectedNode);
    }

    if (selectedNode && event.keyCode == 90 && shiftDown) { //when 'z' and shift are pressed down
        if (selectedNode.object.name == "Node") {
            selectedNode.object.position.y = 2.5;

        } else {
            selectedNode.object.position.y = 0.833;
            updateEditorNodes(selectedNode);
        }
    }

    // when 'g' or 'm' are pressed
    if (event.keyCode == 71 || event.keyCode == 77) {
        moveMode = true;
    }

    if (event.keyCode == 90) {
        moveModeZ = true;
    }

    if (event.keyCode == 88) {
        moveModeX = true;
    }

    if (event.keyCode == 89) {
        moveModeY = true;
    }

    // when shift is pressed activate link implementor
    if (event.keyCode == 16) {
        shiftDown = true;
        linkStartupShift(selection);
        disableMoveModes();
    }

}

/* Called when a key is released */
function onKeyUp(event) {
    // when the move button is released, do not drag the node anymore
    if (event.keyCode == 71 || event.keyCode == 77) {
        moveMode = false;
    }

    if (event.keyCode == 90) {
        moveModeZ = false;
    }

    if (event.keyCode == 88) {
        moveModeX = false;
    }

    if (event.keyCode == 89) {
        moveModeY = false;
    }

    if (event.keyCode == 68) { //when 'd' is released
        isDuplicating = false;
    }

    // If shift is released then also call linkEnd
    if (event.keyCode == 16) {
        updateIntersect();
        shiftDown = false;
        // call linkEnd in link_implementation and handle the cases there. Make sure its not the srcNode
        linkEnd(intersect);
    }


}

/* Called when the mouse is pressed down */
function onMouseDown(event) {
    //Find all intersected objects 
    updateIntersect();
    if (!intersect) {
        return;
    }
    hideAllMenus();
    switch (event.button) {
        case 0: // left 
            hideAllMenus();
            if (intersect.object.name == "yArrow") {
                controls.enabled = false;
                disableMoveModes();
                selection = intersect.object;
                lastPos = selection.position;
                moveModeY = true;
                // Calculate the offset
                offset.set(intersect.point.x - intersect.object.position.x, intersect.point.y - intersect.object.position.y, intersect.point.z - intersect.object.position.z);
                //console.log(offset);
            }
            else if (intersect.object.name == "xArrow") {
                controls.enabled = false;
                disableMoveModes();
                selection = intersect.object;
                lastPos = selection.position;
                moveModeX = true;
                offset.set(intersect.point.x - intersect.object.position.x, intersect.point.y - intersect.object.position.y, intersect.point.z - intersect.object.position.z);
            }
            else if (intersect.object.name == "zArrow") {
                controls.enabled = false;
                disableMoveModes();
                selection = intersect.object;
                lastPos = selection.position;
                moveModeZ = true;
                offset.set(intersect.point.x - intersect.object.position.x, intersect.point.y - intersect.object.position.y, intersect.point.z - intersect.object.position.z);
            }
            if (intersect.object.name == "Node" && shiftDown) {
                // when the mouse is pressed and we find a node, 
                selection = intersect.object;
                linkStartupClick(selection);
            } else if ((intersect.object.name == "Node" || intersect.object.name == "Host") && moveMode) { //when g or m is held down
                controls.enabled = false;
                if (selectedNode) {
                    selectedNode.object.material.opacity = 1;
                    toggleNodeMenuOff();
                }
                selection = intersect.object;
                latestNode = intersect.object;
                selectedNode = getObject(intersect.object);
                toggleLinkMenuOff();
                toggleNodeMenuOn();
            }
            break;
        case 1: // middle
            break;
        case 2: // right
            // Check if we hit a node
            if (intersect.object.name == "Node" || intersect.object.name == "Host") {
                // set selection to the selected node
                selection = intersect.object;
                latestNode = intersect.object;
                disableMoveModes();
            }
            break;
    }
}

/* Called when the mouse is relesed after dragging */
function onMouseUp(event) {
    //Enable controls again
    controls.enabled = true;
    //updateLinkPositions();
    if (selection && latestNode && event.button == 0 && latestNode.name == "Host" && viewMode != 3) { //This is when you finish dragging a host
        updateEditorNodes(getObject(latestNode));
    }
    selection = null;
    if (arrows) {
        for (var i = 0; i < arrows.length; i++) {
            arrows[i].position.set(latestNode.position.x, latestNode.position.y, latestNode.position.z);
        }
    }
    updateIntersect();
    // call linkEnd in link_implementation and handle the cases there. Make sure its not the srcNode
    linkEnd(intersect);
}


// When the mouse is moved then update the mouse values
function onMouseMove(event) {
    event.preventDefault();
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    var width = window.innerWidth;
    var height = window.innerHeight;
    var rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / canvas.height) * 2 + 1;
    mouseClientX = event.clientX;
    mouseClientY = event.clientY;
    deltaMouseY = mouse.y - oldMouseY;
    deltaMouseX = mouse.x - oldMouseX;
    oldMouseY = mouse.y;
    oldMouseX = mouse.x;

    if (arrows && latestNode) {
        for (var i = 0; i < arrows.length; i++) {
            arrows[i].position.set(latestNode.position.x, latestNode.position.y, latestNode.position.z);
        }
    }

    // get the 3D position and create a raycaster
    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersections = raycaster.intersectObjects(scene.children, false);

    //first check if we've already selected an object by clicking
    if (selection) {
        // check the position where the plane is intersected
        //var intersects = raycaster.intersectObject(plane);
        //reposition the selection based on the intersection with the plane
        //selection.position.copy(intersects[0].point.sub(offset));
    } else {
        // if we havent selected an object, we check if we might need to reposition our plane. 
        // We do this here since we need to have this position before the onMouseDown to calculate the offset
        updateIntersect()
        if (intersect) {
            if (intersect.object.name == "Node" || intersect.object.name == "Host") {
                // now reposition the plane to the selected objects position
                plane.position.copy(intersect.object.position);
                // and align with the camera
                plane.lookAt(camera.position);
            } else if (intersect.object.name == "xArrow") {
                plane.position.copy(intersect.object.position);
                plane.lookAt(9999, 0, 0);
            } else if (intersect.object.name == "yArrow") {
                plane.position.copy(intersect.object.position);
                plane.lookAt(0, 9999, 0);
            } else if (intersect.object.name == "zArrow") {
                plane.position.copy(intersect.object.position);
                plane.lookAt(0, 0, 9999);
            }
        }
    }


}

function disableMoveModes() {
    moveMode = false;
    moveModeX = false;
    moveModeY = false;
    moveModeZ = false;
}

/****************************************************************************************/