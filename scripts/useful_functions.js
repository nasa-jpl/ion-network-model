/* **************************************************************************/

/* This file will hold useful, self contained functions to simplify the 3Dapp.js script */

var nodeMenuSave = false; //this variable allows the save button to communicate with context_menu_manipulations, which is below the button function call. 
var hostMenuSave = false;
var linkMenuSave = false;
/***************************************************************************************/

/*-------------------------------CLASSES------------------------------------------------
****************************************************************************************/
/* This is the host class. It should store all the properties for each host. */
function Host() {
    this.hostLabel = "";
    this.hostDesc = "";
    this.address = [];
    //platforms
    this.platform = 'unix'; //0 Windows, 1 Unix, 2 Mac
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = 0;
    this.nodes = [];
    this.object = null;
    this.wireframe = null;
    this.labelMesh = null;
    this.color = "Black";
}

/* This is the node class. It should store all the properties for each node. */
function Node() {
    this.nodeLabel = "";
    this.nodeDesc = "";
    this.endpointID = "";
    this.position = new THREE.Vector3(0, 0, 0);
    this.host = null;
    //Protocols
    this.ltp = false;
    this.udp = false;
    this.tcp = false;
    this.stcp = false;
    this.otherProtocol = "";
    //Services
    this.cfdp = false;
    this.ams = false;
    this.otherService = "";
    this.isIonNodeType = true;
    this.object = null;
    this.wireframe = null;
    this.labelMesh = null;
    this.IDMesh = null;
    this.color = "White";
}

/* This is the link class. It should store all the link information. */
function Link() {
    this.Node1 = new Node();
    this.Node2 = new Node();
    this.linkMesh = null;

    this.symmetric = false;
    this.exists12 = false;
    this.exists21 = false;
    this.maxRate12 = 0;
    this.maxRate21 = 0;
    this.tcp12 = false;
    this.tcp21 = false;
    this.ltp12 = false;
    this.ltp21 = false;
    this.udp12 = false;
    this.udp21 = false;
    this.stcp12 = false;
    this.stcp21 = false;
    this.dccp12 = false;
    this.dccp21 = false;
    this.bpLayerOther12 = false;
    this.bpLayerOther21 = false;
    this.bpLayerOtherText12 = "";
    this.bpLayerOtherText21 = "";
    this.ltpLayer12 = "";
    this.ltpLayer21 = "";
    this.description12 = "";
    this.description21 = "";
    this.color = "White";
}

function hostLink() {
    this.Node1 = new Node();
    this.Node2 = new Node();
    this.linkMesh = null;
    this.color = "White";
}
/***************************************************************************************/

/* This function gets the node or host class object given the object's mesh */
function getObject(mesh) {
    for (var i = 0; i < nodeMasterList.length; i++) {
        if (nodeMasterList[i].object == mesh) {
            nodeMasterList[i].object.position = mesh.position; //update position of node
            return nodeMasterList[i];
        }
    }
    for (var i = 0; i < hostMasterList.length; i++) {
        if (hostMasterList[i].object == mesh) {
            hostMasterList[i].object.position = mesh.position;
            return hostMasterList[i];
        }
    }
    //console.log("the node class was not found for the mesh");
}

function getObjectFromLabel(label, hostFirst = false) {
    if (hostFirst) {
        for (var i = 0; i < hostMasterList.length; i++) {
            if (hostMasterList[i].hostLabel == label) {
                return hostMasterList[i];
            }
        }
        for (var i = 0; i < nodeMasterList.length; i++) {
            if (nodeMasterList[i].nodeLabel == label) {
                return nodeMasterList[i];
            }
        }
    } else {
        for (var i = 0; i < nodeMasterList.length; i++) {
            if (nodeMasterList[i].nodeLabel == label) {
                return nodeMasterList[i];
            }
        }
        for (var i = 0; i < hostMasterList.length; i++) {
            if (hostMasterList[i].hostLabel == label) {
                return hostMasterList[i];
            }
        }
    }
}

/* This function gets the link class object given the link mesh */
function getLink(linkMesh) {
    for (var i = 0; i < linkMasterList.length; i++) {
        if (linkMasterList[i].linkMesh == linkMesh) {
            return linkMasterList[i];
        }
    }
    console.log("the link class was not found for the mesh");
}

/* This function nodeMenuSave to true so that context_menu_manipulations can know when to save the node */
function nodeSave() {
    nodeMenuSave = true;
    return false;
}

/* This function nodeMenuSave to true so that context_menu_manipulations can know when to save the host */
function hostSave() {
    hostMenuSave = true;
    return false;
}

/* This function sets linkMenuSave to true so that context_menu_manipulations can know when to save the link */
function linkSave() {
    linkMenuSave = true;
    return false;
}








