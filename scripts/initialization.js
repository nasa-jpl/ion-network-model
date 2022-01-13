/***************************************************************************************
 This script holds most of the initialization code, as well as many useful functions and 
 variables that are used by the other scripts. 
 **************************************************************************************/



// Set up the scene, camera, and renderer as global variables.
var scene, scene2, camera, renderer, WIDTH, HEIGHT, light, pointer, controls, canvas;
var canvasPosition;
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var nodeCounter = 0;
var hostMasterList = [];
var nodeMasterList = [];
var linkMasterList = [];
var hostLinkMasterList = {};
var nodePosDict = {}; //this dictionary keeps track of the node positions for each host's inspect mode (multi-dimensional)
var moveMode; // Bool set to true when g or m are pressed
var moveModeZ; // Set to true when z is pressed
var moveModeX;
var moveModeY;
var oldMouseY;
var oldMouseX;
var dragSensitivity = 100;
var intersect; // This should store the intersect object from the raycast (ignoring the pointer)
var offset = new THREE.Vector3(); // this is used when dragging objects
var selection; // selection gets filled with an object when the mouse clicks on it
var latestNode; //filled with the latest currently selected node
var showLabels = true;
var addLoc;
var lastPos = new THREE.Vector3(0, 0, 0);
var insideMenu = false;
var insideDropdowns = false;
var viewMode = 0; //0 is everything, 1 is nodes only, 2 is hosts only, 3 is inspecting host
var inspectingHost = false;
var isInForm = false;
var isDuplicating = false;

init(); // call to initialize

/* Initialize the scene with default objects:
    * Scene
    * Renderer
    * Camera
    * Light
    * 3D Objects
*/
function init() {

    // Create the scene and set the scene size.
    scene = new THREE.Scene();
    scene2 = new THREE.Scene();
    WIDTH = window.innerWidth; // adjust size of scene based on window size
    HEIGHT = window.innerHeight;

    // create the renderer
    initializeRenderer();

    camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 20000);
    camera.position.set(-35, 45, 125);
    camera.lookAt(0, 0, 0);//NOT WORKING
    scene.add(camera);

    // Create an event listener that resizes the renderer with the browser window.
    window.addEventListener('resize', function () {
        var WIDTH = window.innerWidth,
            HEIGHT = window.innerHeight;
        renderer.setSize(WIDTH, HEIGHT);
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();
    });

    createGrid();
    initializeLight();

    /* Create the objects to initialize the scene */

    // Create cylinder
    nodeCounter = nodeMasterList.length;
    scene.add(generateNewNode(new THREE.Vector3(0, 2.5, 0)));
    nodeCounter++;

    // Create ground plane
    var geometry = new THREE.PlaneGeometry(100, 100, 16);
    var material = new THREE.MeshBasicMaterial({
        color: "rgb(155, 155, 155)",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });
    var ground = new THREE.Mesh(geometry, material);
    ground.name = "Ground";
    ground.rotation.set(1.5708, 0, 1.5708);
    ground.material.visible = false;
    scene.add(ground);

    // Add OrbitControls so that we can pan around with the mouse.
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Add a small ball to act as a cursor for node placement (should approximately follow cursor)
    var geometry = new THREE.SphereGeometry(.4, 6, 6);
    var material = new THREE.MeshBasicMaterial({ color: "rgb(255, 0, 0)" });
    pointer = new THREE.Mesh(geometry, material);
    pointer.name = "pointer";
    scene.add(pointer);
}

/* Initialize the renderer */
function initializeRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(WIDTH, HEIGHT);
    canvas = renderer.domElement;
    //enable shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default shadowmap
    renderer.autoClear = false;
    document.body.appendChild(renderer.domElement);
}

/* Initialize the light and its properties */
function initializeLight() {
    // Create a light, set its position, and add it to the scene.
    light = new THREE.DirectionalLight(0xffffff, 1, 100);
    light.position.set(-100, 200, 100);
    //light.castShadow = true;
    scene.add(light);
}

/* Create a plane that helps determine an intersection position
   This plane is invisible and is just used in determining the 
   axis to be used when moving around the nodes. */
var plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(9999, 9999, 8, 8), new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0,
    transparent: true

}));
plane.name = "helperPlane";
plane.material.side = THREE.DoubleSide;
plane.material.visible = false;
scene.add(plane);

/*  This function creates a node at specified location 
    This function gets called by placeNode when the user wants to add a node 
    Args:
        position (Vector3): The position to place the node. 
*/
function generateNewNode(position) {
    // Declare new node object, set some properties, push to master list. 
    var node = new Node();
    node.position = position;

    // Create the physical node object
    var geometry = new THREE.CylinderGeometry(2, 2, 5, 10);
    var material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });
    var cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(position.x, position.y, position.z);
    //cylinder.castShadow = true;
    //cylinder.receiveShadow = true;
    cylinder.name = "Node";

    // Add wireframe to make the node look cooler
    var geometry = new THREE.EdgesGeometry(cylinder.geometry);
    var mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
    var wireframe = new THREE.LineSegments(geometry, mat);
    wireframe.name = "wireframe";
    cylinder.add(wireframe);

    // store the node geometry in the object
    node.object = cylinder;
    node.wireframe = node.object.getObjectByName("wireframe");
    node.labelMesh = node.object.getObjectByName("Label Mesh");

    // Store this node in the master array
    nodeMasterList.push(node);
    return cylinder;
}

function generateNewHost(position) {
    // Declare new node object, set some properties, push to master list. 
    var host = new Host();
    host.position = position;

    // Create the physical node object
    var geometry = new THREE.BoxGeometry(5, 1.666, 5);
    var material = new THREE.MeshBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 1,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });
    var box = new THREE.Mesh(geometry, material);
    box.position.set(position.x, position.y, position.z);
    box.rotation.set(0, 0, 0);
    box.name = "Host";

    // Add wireframe to make the node look cooler
    var geometry = new THREE.EdgesGeometry(box.geometry);
    var mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    var wireframe = new THREE.LineSegments(geometry, mat);
    wireframe.name = "wireframe";
    box.add(wireframe);

    // store the node geometry in the object
    host.object = box;
    host.wireframe = host.object.getObjectByName("wireframe");
    host.labelMesh = host.object.getObjectByName("Label Mesh");

    // Store this node in the master array
    hostMasterList.push(host);
    return box;
}

function loadNode(position, nodeLabel, rgb) {
    // Create the physical node object
    var geometry = new THREE.CylinderGeometry(2, 2, 5, 10);
    var material = new THREE.MeshBasicMaterial({
        color: lookupColor(rgb),
        transparent: true,
        opacity: 1,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });
    var cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(position.x, position.y, position.z);
    //cylinder.castShadow = true;
    //cylinder.receiveShadow = true;
    cylinder.name = "Node";

    // Add wireframe to make the node look cooler
    var geometry = new THREE.EdgesGeometry(cylinder.geometry);
    var mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
    var wireframe = new THREE.LineSegments(geometry, mat);
    wireframe.name = "wireframe";
    cylinder.add(wireframe);
    scene.add(cylinder);
    return cylinder;
}

function loadHost(position, hostLabel, rgb) {
    // Create the physical node object
    var geometry = new THREE.BoxGeometry(5, 1.666, 5);
    var material = new THREE.MeshBasicMaterial({
        color: lookupColor(rgb),
        transparent: true,
        opacity: 1,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });
    var box = new THREE.Mesh(geometry, material);
    box.position.set(position.x, position.y, position.z);
    box.name = "Host";
    // Add wireframe to make the node look cooler
    var geometry = new THREE.EdgesGeometry(box.geometry);
    var mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    var wireframe = new THREE.LineSegments(geometry, mat);
    wireframe.name = "wireframe";
    box.add(wireframe);
    scene.add(box);
    nodePosDict[hostLabel] = {};
    return box;
}

function duplicateNode(oldNode) {
    // Declare new node object, copy the old node's properties, push to master list. 
    var newNode = new Node();
    oldNode.position = oldNode.object.position;
    newNode.position = oldNode.position;

    //Duplicate label so that all labels are unique
    newNode.nodeLabel = oldNode.nodeLabel;
    for (var i = 0; i < nodeMasterList.length; i++) {
        if (newNode.nodeLabel == nodeMasterList[i].nodeLabel) {
            var regex = /\([0-9]+\)/g;
            if (regex.test(newNode.nodeLabel)) {
                var matches = newNode.nodeLabel.match(regex);
                var replacement = Number(matches[matches.length - 1].slice(1, -1));
                replacement++;
                replacement = "(" + replacement + ")";
                var m = 0;
                newNode.nodeLabel = newNode.nodeLabel.replace(regex, function (match) {
                    m++;
                    return (m === matches.length) ? replacement : match;
                });
            } else {
                newNode.nodeLabel = newNode.nodeLabel + "(1)";
            }
            i = 0;
        }
    }

    newNode.nodeId = oldNode.nodeId;
    newNode.endpointID = oldNode.endpointID;
    newNode.nodeName = oldNode.nodeName;
    newNode.nodeDesc = oldNode.nodeDesc;
    newNode.host = null;
    //Protocols
    newNode.ltp = oldNode.ltp;
    newNode.udp = oldNode.udp;
    newNode.tcp = oldNode.tcp;
    newNode.stcp = oldNode.stcp;
    //Services
    newNode.cfdp = oldNode.cfdp;
    newNode.ams = oldNode.ams;
    newNode.isIonNodeType = oldNode.isIonNodeType;
    newNode.color = oldNode.color;

    // Create the physical node object
    var geometry = new THREE.CylinderGeometry(2, 2, 5, 10);
    var material = new THREE.MeshBasicMaterial({
        color: lookupColor(oldNode.color),
        transparent: true,
        opacity: 0.5,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });
    var cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(oldNode.position.x, oldNode.position.y, oldNode.position.z);
    cylinder.name = "Node";

    // Add wireframe to make the node look cooler
    var geometry = new THREE.EdgesGeometry(cylinder.geometry);
    var mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
    var wireframe = new THREE.LineSegments(geometry, mat);
    wireframe.name = "wireframe";
    cylinder.add(wireframe);

    // store the node geometry in the object
    newNode.object = cylinder;
    newNode.wireframe = newNode.object.getObjectByName("wireframe");
    newNode.labelMesh = newNode.object.getObjectByName("Label Mesh");

    // Store this node in the master array
    nodeMasterList.push(newNode);
    scene.add(cylinder);
    return newNode;
}

function duplicateHost(oldHost) {
    // Declare new node object, set some properties, push to master list. 
    var newHost = new Host();
    oldHost.position = oldHost.object.position;
    newHost.position = oldHost.position;

    //Duplicate label so that all labels are unique
    newHost.hostLabel = oldHost.hostLabel;
    for (var i = 0; i < hostMasterList.length; i++) {
        if (newHost.hostLabel == hostMasterList[i].hostLabel) {
            var regex = /\([0-9]+\)/g;
            if (regex.test(newHost.hostLabel)) {
                var matches = newHost.hostLabel.match(regex);
                var replacement = Number(matches[matches.length - 1].slice(1, -1));
                replacement++;
                replacement = "(" + replacement + ")";
                var m = 0;
                newHost.hostLabel = newHost.hostLabel.replace(regex, function (match) {
                    m++;
                    return (m === matches.length) ? replacement : match;
                });
            } else {
                newHost.hostLabel = newHost.hostLabel + "(1)";
            }
            i = 0;
        }
    }
    newHost.hostId = oldHost.hostId;
    newHost.hostName = oldHost.hostName;
    newHost.hostDesc = oldHost.hostDesc;
    newHost.platform = oldHost.platform;
    newHost.address = oldHost.address;
    newHost.nodes = [];
    newHost.address = oldHost.address;
    newHost.color = oldHost.color;

    // Create the physical node object
    var geometry = new THREE.BoxGeometry(5, 1.666, 5);
    var material = new THREE.MeshBasicMaterial({
        color: lookupColor(oldHost.color),
        transparent: true,
        opacity: 0.5,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });
    var box = new THREE.Mesh(geometry, material);
    box.position.set(oldHost.position.x, oldHost.position.y, oldHost.position.z);
    box.name = "Host";

    // Add wireframe to make the node look cooler
    var geometry = new THREE.EdgesGeometry(box.geometry);
    var mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    var wireframe = new THREE.LineSegments(geometry, mat);
    wireframe.name = "wireframe";
    box.add(wireframe);

    // store the node geometry in the object
    newHost.object = box;
    newHost.wireframe = newHost.object.getObjectByName("wireframe");
    newHost.labelMesh = newHost.object.getObjectByName("Label Mesh");

    // Store this node in the master array
    hostMasterList.push(newHost);
    scene.add(box);
    return newHost;
}

/* Clears the current DTN configuration */
function reset() {
    nodePosDict = {};
    inspectingHost = false;
    for (i = 0; i < nodeMasterList.length; i++) {
        curNode = nodeMasterList[i];
        scene.remove(curNode.object); // Remove object from the scene
        curNode = null; // Clear the node class object
    }
    nodeCounter = 0;
    nodeMasterList = []; // clear the master list
    for (i = 0; i < linkMasterList.length; i++) {
        curLink = linkMasterList[i];
        scene.remove(curLink.linkMesh);
        curLink.Node1 = null;
        curLink.Node2 = null;
        curLink = null;
    }
    linkMasterList = []; // clear the host master list
    for (i = 0; i < hostMasterList.length; i++) {
        curHost = hostMasterList[i];
        scene.remove(curHost.object);
        curHost = null;
    }
    var ul = document.getElementById("nodeList");
    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }
    hostMasterList = [];
    hostLinkMasterList = {};
    //showLabels = true;
    //document.getElementById("labels").textContent = "Labels \u2713";
    toggleAddMenu(false);
    toggleJSONImportMenuOff();
    toggleJSONMenuOff();
    toggleLinkMenuOff();
    toggleNodeMenuOff();
    document.getElementById("selectedName").textContent = "";
    updateHierarchy();
    removeArrows();
}

// Saves the DTN Configuration to local storage
function save() {
    localStorage.setItem("network-data", createJSON(true));
    alert("Your work has been saved.");
}

// takes the last saved data and loads it into the scene
function load() {
    if (nodeMasterList.length > 1 || hostMasterList > 0) {
        if (confirm("There might be unsaved work. Are you sure you want to load a new model?") == false) {
            return;
        }
    }
    reset();
    var jsonObject = JSON.parse(localStorage.getItem("network-data"));
    populateScene(jsonObject);
}

function importJSONFile() {
    setViewState(0);
    if (!document.getElementById("merge").checked) {
        reset();
    }
    json = document.getElementById("myFile").files[0];
    read = new FileReader();

    read.readAsBinaryString(json);

    read.onloadend = function () {
        var jsonObject = JSON.parse(read.result);
        populateScene(jsonObject);
        toggleJSONImportMenuOff();
    }
    return false;
}

// This function is called when loading to repopulate the scene with new network data
function populateScene(json) {
    if (!json) {
        alert("There is no data to load");
        return;
    }
    var alertb = false;
    var newHosts = [];
    var newNodes = [];
    //Deserialize Hosts
    for (var jsonHost in json["netHosts"]) { //unpack all data from json file
        var hostData = json["netHosts"][jsonHost];
        var host = new Host();
        host.hostLabel = jsonHost;
        host.hostName = hostData["hostName"];
        host.hostDesc = hostData["hostDesc"];
        host.color = hostData["color"];
        host.platform = hostData["platform"];
        host.position = new THREE.Vector3(hostData["positionX"], hostData["positionY"], hostData["positionZ"]);
        host.rotationY = hostData["rotationY"];
        host.nodes = hostData["hostNodes"];
        host.address = hostData["ipAddrs"];
        for (var i = 0; i < hostMasterList.length; i++) {
            if (jsonHost == hostMasterList[i].hostLabel) {
                alertb = true;
            }
        }
        newHosts.push(host);
    }

    //Deserialize Nodes
    for (var jsonNode in json["netNodes"]) {
        var nodeData = json["netNodes"][jsonNode];
        var node = new Node();
        node.nodeLabel = jsonNode;
        if (nodeData["nodeType"] == "ion") {
            node.isIonNodeType = true;
        }
        else {
            node.isIonNodeType = false;
        }
        node.endpointID = nodeData["endpointID"];
        node.nodeDesc = nodeData["nodeDesc"];
        node.color = nodeData["color"];
        node.position = new THREE.Vector3(nodeData["positionX"], nodeData["positionY"], nodeData["positionZ"]);
        if (nodeData["nodeType"] == "dtn") {
            node.isIonNodeType = false;
        }
        var protocols = nodeData["protocols"];
        var other = [];
        for (i = 0; i < protocols.length; i++) {
            if (protocols[i] == "ltp") { node.ltp = true; continue; }
            if (protocols[i] == "udp") { node.udp = true; continue; }
            if (protocols[i] == "tcp") { node.tcp = true; continue; }
            if (protocols[i] == "stcp") { node.stcp = true; continue; }
            other.push(protocols[i]);
        }
        node.otherProtocol = other.join(',');
        var services = nodeData["services"];
        other = [];
        for (i = 0; i < services.length; i++) {
            if (services[i] == "cfdp") { node.cfdp = true; continue; }
            if (services[i] == "ams") { node.ams = true; continue; }
            other.push(services[i]);
        }
        node.otherService = other.join(',');
        node.host = nodeData["nodeHost"];
        for (var i = 0; i < nodeMasterList.length; i++) {
            if (jsonNode == nodeMasterList[i].nodeLabel) {
                alertb = true;
            }
        }
        newNodes.push(node);
    }

    //check labels and only continue if user wants
    if (alertb) {
        if (confirm("There is a problem with the import. Some labels may not be unique. Would you like to continue?") == false) {
            return;
        }
    }

    //add the hosts and nodes
    for (i = 0; i < newHosts.length; i++) {
        newHosts[i].object = loadHost(newHosts[i].position, newHosts[i].hostLabel, newHosts[i].color);
        newHosts[i].object.rotation.y = newHosts[i].rotationY;
        newHosts[i].wireframe = newHosts[i].object.getObjectByName("wireframe");
        newHosts[i].labelMesh = newHosts[i].object.getObjectByName("Label Mesh");
        if (showLabels) {
            updateHostLabel(newHosts[i]);
        }
        hostMasterList.push(newHosts[i]);
        setupHost(newHosts[i]);
    }
    for (i = 0; i < newNodes.length; i++) {
        newNodes[i].host = getObjectFromLabel(newNodes[i].host);
        newNodes[i].object = loadNode(newNodes[i].position, newNodes[i].nodeLabel, newNodes[i].color);
        newNodes[i].wireframe = newNodes[i].object.getObjectByName("wireframe");
        newNodes[i].labelMesh = newNodes[i].object.getObjectByName("Label Mesh");
        if (showLabels) {
            updateNodeLabel(newNodes[i]);
        }
        nodeMasterList.push(newNodes[i]); //Store this node in the master array
    }

    //Deserialize Links
    for (var jsonLink in json["netHops"]) { // loop through each hop
        var linkData = json["netHops"][jsonLink];
        var alreadyUpdatedLink = false;
        if (!linkData["symmetric"]) {
            for (i = 0; i < linkMasterList.length; i++) { // loop through each already added link
                // if existing link contains same nodes but in different order, add to link
                if (linkMasterList[i].Node1.nodeLabel == linkData["toNode"] && linkMasterList[i].Node2.nodeLabel == linkData["fromNode"]) {
                    linkMasterList[i].exists21 = true;
                    linkMasterList[i].maxRate21 = linkData["maxRate"];
                    //linkMasterList[i].startTime21 = linkData["startTime"];
                    //linkMasterList[i].endTime21 = linkData["endTime"];
                    linkMasterList[i].description21 = linkData["hopDesc"];
                    switch (linkData["bpLayer"]) {
                        case "tcp":
                            linkMasterList[i].tcp21 = true;
                            break;
                        case "ltp":
                            linkMasterList[i].ltp21 = true;
                            linkMasterList[i].ltpLayer21 = linkData["ltpLayer"];
                            break;
                        case "udp":
                            linkMasterList[i].udp21 = true;
                            break;
                        case "stcp":
                            linkMasterList[i].stcp21 = true;
                            break;
                        case "dccp":
                            linkMasterList[i].dccp21 = true;
                            break;
                        case "":
                            break;
                        default:
                            linkMasterList[i].bpLayerOther21 = true;
                            linkMasterList[i].bpLayerOtherText21 = linkData["bpLayer"];
                    }
                    alreadyUpdatedLink = true;
                }
            }
        }
        if (!alreadyUpdatedLink) {
            // if no link already made for this connection, make one
            var mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
            var geo = new THREE.Geometry();
            geo.vertices.push(getObjectFromLabel(linkData["fromNode"]).object.position, getObjectFromLabel(linkData["toNode"]).object.position);
            var linkMesh = new THREE.Line(geo, mat);
            linkMesh.name = "Link";
            scene.add(linkMesh);
            var link = new Link();
            link.linkMesh = linkMesh;
            if (linkData["color"] == "") {
                link.color = "White";
            } else {
                link.color = linkData["color"];
                selectedLink = link;
                changeLinkColor(link.color);
            }
            link.Node1 = getObjectFromLabel(linkData["fromNode"]);
            link.Node2 = getObjectFromLabel(linkData["toNode"]);
            // draw the link lines
            link.symmetric = linkData["symmetric"];
            if (!link.symmetric) { // if its not symmetric
                if (linkData["exists12"]) {
                    link.exists12 = true;
                    link.maxRate12 = linkData["maxRate"];
                    //link.startTime12 = linkData["startTime"];
                    //link.endTime12 = linkData["endTime"];
                    link.description12 = linkData["hopDesc"];
                    switch (linkData["bpLayer"]) {
                        case "tcp":
                            link.tcp12 = true;
                            break;
                        case "ltp":
                            link.ltp12 = true;
                            link.ltpLayer12 = linkData["ltpLayer"];
                            break;
                        case "udp":
                            link.udp12 = true;
                            break;
                        case "stcp":
                            link.stcp12 = true;
                            break;
                        case "dccp":
                            link.dccp12 = true;
                            break;
                        default:
                            link.bpLayerOther12 = true;
                            link.bpLayerOtherText12 = linkData["bpLayer"];
                    }
                }
                if (linkData["exists21"]) {
                    link.exists21 = true;
                    link.maxRate21 = linkData["maxRate"];
                    //link.startTime21 = linkData["startTime"];
                    //link.endTime21 = linkData["endTime"];
                    link.description21 = linkData["hopDesc"];
                    switch (linkData["bpLayer"]) {
                        case "tcp":
                            link.tcp21 = true;
                            break;
                        case "ltp":
                            link.ltp21 = true;
                            link.ltpLayer21 = linkData["ltpLayer"];
                            break;
                        case "udp":
                            link.udp21 = true;
                            break;
                        case "stcp":
                            link.stcp21 = true;
                            break;
                        case "dccp":
                            link.dccp21 = true;
                            break;
                        default:
                            link.bpLayerOther21 = true;
                            link.bpLayerOtherText21 = linkData["bpLayer"];
                    }
                }
            }
            else { // if it is symmetric
                link.exists12 = true;
                link.exists21 = true;
                link.maxRate12 = linkData["maxRate"];
                link.maxRate21 = linkData["maxRate"];
                /*link.startTime12 = linkData["startTime"];
                link.endTime12 = linkData["endTime"];
                link.startTime21 = linkData["startTime"];
                link.endTime21 = linkData["endTime"];*/
                link.description12 = linkData["hopDesc"];
                link.description21 = linkData["hopDesc"];

                switch (linkData["bpLayer"]) {
                    case "tcp":
                        link.tcp12 = true;
                        link.tcp21 = true;
                        break;
                    case "ltp":
                        link.ltp12 = true;
                        link.ltp21 = true;
                        link.ltpLayer12 = linkData["ltpLayer"];
                        link.ltpLayer21 = linkData["ltpLayer"];
                        break;
                    case "udp":
                        link.udp12 = true;
                        link.udp21 = true;
                        break;
                    case "stcp":
                        link.stcp12 = true;
                        link.stcp21 = true;
                        break;
                    case "dccp":
                        link.dccp12 = true;
                        link.dccp21 = true;
                        break;
                    default:
                        link.bpLayerOther12 = true;
                        link.bpLayerOther21 = true;
                        link.bpLayerOtherText12 = linkData["bpLayer"];
                        link.bpLayerOtherText21 = linkData["bpLayer"];
                }
            }
            linkMasterList.push(link);
        }
    }

    //Deserialize Host Links
    for (var jsonHostLink in json["localHostLinks"]) {
        var hostL = new hostLink();
        hostL.color = json["localHostLinks"][jsonHostLink];
        hostLinkMasterList[jsonHostLink] = hostL;
    }

    //Deserialize View mode Node positions
    if (json["localViewPos"]) {
        nodePosDict = Object.assign({}, nodePosDict, json["localViewPos"]); //merge the two dictionaries
    }

    updateHierarchy();
}

function setupHost(host) {
    if (host.nodes.length <= 0) {
        host.object.scale.set(1, host.object.scale.y, host.object.scale.z);
    } else {
        host.object.scale.set(host.nodes.length, host.object.scale.y, host.object.scale.z);
    }
    document.getElementById("numOfNodes").value = 0;
}

function createGrid() {
    for (var i = 0; i < 11; i++) {
        var material = new THREE.LineBasicMaterial({ color: 0xbbbbbb, linewidth: 0.5});
        if (i === 5) material.color.setHex(0xff0000);
        var geo = new THREE.Geometry();
        var x = i * 10 - 50;
        geo.vertices.push(
            new THREE.Vector3(0, 0, -50),
            new THREE.Vector3(0, 0, 50)
        );
        var line = new THREE.Line(
            geo,
            material
        );
        line.position.x = x;
        if (i == 0 || i == 10) {
            line.name = "Grid Border";
        }
        else {
            line.name = "Grid Line";
        }
        scene.add(line);
    }
    for (var i = 0; i < 11; i++) {
        var material = new THREE.LineBasicMaterial({ color: 0xbbbbbb });
        if (i === 5) material.color.setHex(0x0cff00);
        var geo = new THREE.Geometry();
        var x = i * 10 - 50;
        geo.vertices.push(
            new THREE.Vector3(-50, 0, 0),
            new THREE.Vector3(50, 0, 0)
        );
        var line = new THREE.Line(
            geo,
            material
        );
        line.position.z = x;
        if (i == 0 || i == 10) {
            line.name = "Grid Border";
        }
        else {
            line.name = "Grid Line";
        }
        scene.add(line);
    }
}

function toggleDropdowns(name) {
    insideDropdowns = !insideDropdowns;
    if (!insideDropdowns) {
        hideAllMenus();
    } else {
        switch (name) {
            case "help":
                toggleHelpMenu(true);
                break;
            case "view":
                toggleViewMenu(true);
                break;
            case "window":
                toggleWindowMenu(true);
        }
    }
}
function toggleHelpMenu(enable) {
    var helpMenu = document.getElementById("help-menu");
    if (enable && insideDropdowns) {
        if (helpMenu.style.display === "block") {
            helpMenu.style.display = "none";
            showInstructions(false);
            showNotes(false);
            return;
        }
        var rect = document.getElementById("help").getBoundingClientRect();
        helpMenu.style.left = rect.left + "px";
        helpMenu.style.top = rect.bottom + "px";
        helpMenu.style.display = "block";
        toggleViewMenu(false);
        toggleWindowMenu(false);
    } else {
        helpMenu.style.display = "none";
        showInstructions(false);
        showNotes(false);
    }
}
function toggleViewMenu(enable) {
    var viewMenu = document.getElementById("view-menu");
    if (enable && insideDropdowns) {
        if (viewMenu.style.display === "block") {
            viewMenu.style.display = "none";
            return;
        }
        var rect = document.getElementById("view").getBoundingClientRect();
        if (hostMenuState == 1) {
            document.getElementById("hostNodes").style.display = "block";
        } else {
            document.getElementById("hostNodes").style.display = "none";
        }
        viewMenu.style.left = rect.left + "px";
        viewMenu.style.top = rect.bottom + "px";
        viewMenu.style.display = "block";
        toggleHelpMenu(false);
        toggleWindowMenu(false);
    } else {
        viewMenu.style.display = "none";
    }
}
function toggleWindowMenu(enable) {
    var windowMenu = document.getElementById("window-menu");
    if (enable && insideDropdowns) {
        if (windowMenu.style.display === "block") {
            windowMenu.style.display = "none";
            return;
        }
        var rect = document.getElementById("window").getBoundingClientRect();
        windowMenu.style.left = rect.left + "px";
        windowMenu.style.top = rect.bottom + "px";
        windowMenu.style.display = "block";
        toggleViewMenu(false);
        toggleHelpMenu(false);
    } else {
        windowMenu.style.display = "none";
    }
}
function showInstructions(enable) {
    var instructions = document.getElementById("helpInfo");
    if (enable) {
        if (instructions.style.display === "block") {
            instructions.style.display = "none";
            return;
        }
        var rect = document.getElementById("help-menu").getBoundingClientRect();
        instructions.style.left = rect.right + "px";
        instructions.style.top = rect.top - 15 + "px";
        instructions.style.display = "block";
        showNotes(false);
    } else {
        instructions.style.display = "none";
    }
}
function showNotes(enable) {
    var notes = document.getElementById("helpNotes");
    if (enable) {
        if (notes.style.display === "block") {
            notes.style.display = "none";
            return;
        }
        var rect = document.getElementById("help-menu").getBoundingClientRect();
        notes.style.left = rect.right + "px";
        notes.style.top = rect.top - 15 + "px";
        notes.style.display = "block";
        showInstructions(false);
    } else {
        notes.style.display = "none";
    }
}
function showHierarchy(enable) {
    var hierarchy = document.getElementById("hierarchyMenu");
    if (enable) {
        if (hierarchy.style.display === "block") {
            hierarchy.style.display = "none";
            return;
        }
        updateHierarchy();
        hierarchy.style.display = "block";
    } else {
        hierarchy.style.display = "none";
    }
}
function toggleLabels() {
    if (showLabels) {
        showLabels = false;
        for (var i = 0; i < nodeMasterList.length; i++) {
            if (nodeMasterList[i].object.getObjectByName("Label Mesh")) {
                nodeMasterList[i].object.getObjectByName("Label Mesh").visible = false;
            }
        }
        for (var i = 0; i < hostMasterList.length; i++) {
            if (hostMasterList[i].object.getObjectByName("Label Mesh")) {
                hostMasterList[i].object.getObjectByName("Label Mesh").visible = false;
            }
        }
        document.getElementById("labels").textContent = "Labels";
    } else {
        showLabels = true;
        for (var i = 0; i < nodeMasterList.length; i++) {
            if (nodeMasterList[i].object.getObjectByName("Label Mesh")) {
                nodeMasterList[i].object.getObjectByName("Label Mesh").visible = true;
            } else {
                if (showLabels) {
                    updateNodeLabel(nodeMasterList[i]);
                }
            }
        }
        for (var i = 0; i < hostMasterList.length; i++) {
            if (hostMasterList[i].object.getObjectByName("Label Mesh")) {
                hostMasterList[i].object.getObjectByName("Label Mesh").visible = true;
            } else {
                if (showLabels) {
                    updateHostLabel(hostMasterList[i]);
                }
            }
        }
        document.getElementById("labels").textContent = "Labels \u2713";
    }
}
function hideAllMenus() {
    toggleHelpMenu(false);
    toggleViewMenu(false);
    toggleWindowMenu(false);
    showInstructions(false);
    showNotes(false);
    insideDropdowns = false;
}

function populateHierarchy() {
    for (i = 0; i < hostMasterList.length; i++) { //add all hosts to the hierarchy
        var host = addHostToHierarchy(hostMasterList[i].hostLabel);
        for (var j = 0; j < hostMasterList[i].nodes.length; j++) {
            addNodeToHierarchy(hostMasterList[i].nodes[j], host);
        }
    }
    for (i = 0; i < nodeMasterList.length; i++) { //add all nodes to the hierarchy
        if (!nodeMasterList[i].host) {
            addNodeToHierarchy(nodeMasterList[i].nodeLabel);
        }
    }
    var newLine = document.createElement('br');
    document.getElementById('hierarchy').appendChild(newLine);
}

function addHostToHierarchy(host) {
    var head = document.getElementById('hierarchy');
    var entry = document.createElement('li');
    entry.textContent = host;
    entry.setAttribute("class", "hierarchyButton");
    entry.setAttribute("onclick", "selectHostFromHierarchy(\"" + host + "\",event);");
    head.appendChild(entry);
    return entry;
}
function addNodeToHierarchy(node, host = null) {
    var entry = document.createElement('li');
    entry.textContent = node;
    entry.setAttribute("class", "hierarchyButton");
    entry.setAttribute("onclick", "selectNodeFromHierarchy(\"" + node + "\",event);");
    if (host) {
        entry.setAttribute("style", "margin-left: 2em");
        host.appendChild(entry);
    } else {
        var head = document.getElementById('hierarchy');
        head.appendChild(entry);
    }
}

function updateHierarchy() {
    var head = document.getElementById('hierarchy');
    $(head).empty();
    populateHierarchy();
}