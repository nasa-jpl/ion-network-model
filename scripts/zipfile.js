/**
 * Convert graph.nodeInfo to mapping between node numbers and IP
 * Returns a dictionary with key,value pairs of the form: 
 * 	{node number: IP address}
 * Port numbers are optional and default to:
 * LTP: 1113
 * TCP: 4556
 * UDP: 4556
 */
function convertBasicNodeInfo(node_data) {
    var node_numbers_and_IP = {};
    var node_num, ip_addr;
    for (var node in node_data) {
        if (!node_data.hasOwnProperty(node)) continue;
        for (var i = 0; i < node_data[node].length; i++) {
            var pairs = node_data[node][i]
            if (pairs.property == "Node Number")
                node_num = pairs.value;
            if (pairs.property == "IP Address")
                ip_addr = pairs.value;
        }
        node_numbers_and_IP[node_num] = ip_addr;
    }
    return node_numbers_and_IP;
}

/**	
 * Convert graph.linkInfo to edgelist of the graph
 * Returns a dictionary with key,value pairs of the form:
 *  {node number: [(node number, protocol)]}
 * Adjacency list of pairs that represent all edges between the nodes
 * ORDER MATTERS as this is a directed graph
 * Each entry is of the form- {source: [(destination, protocol),...],...}
 * Source and destination numbers must be part of the node numbers list above
 * Accepted protocols are TCP, UDP, and LTP
*/
function convertBasicLinkInfo(node_data, link_data) {
    var edge_list = {};
    var source, target, forward_protocol, backward_protocol, forward, backward;
    for (var node in node_data) {
        if (!node_data.hasOwnProperty(node)) continue;
        for (var i = 0; i < node_data[node].length; i++) {
            var pairs = node_data[node][i];
            if (pairs.property == "Node Number") {
                edge_list[pairs.value] = [];
            }
        }
    }
    for (var link in link_data) {
        if (!link_data.hasOwnProperty(link)) continue;
        for (var i = 0; i < link_data[link].length; i++) {
            var pairs = link_data[link][i];
            if (pairs[0].property == "Source")
                source = pairs[0].node
            else if (pairs[0].property == "Target")
                target = pairs[0].node
            else if (pairs[0].property == "Available?") {
                forward = pairs[0].value;
                backward = pairs[1].value;
            }
            else if (pairs[0].property == "Protocol") {
                forward_protocol = pairs[0].value;
                backward_protocol = pairs[1].value;
            }
        }
        if (forward)
            edge_list[source].push([target, forward_protocol])
        if (backward)
            edge_list[target].push([source, backward_protocol])
    }
    return edge_list;
}

/**
/* Validates the graph information (called when files are requested)
/* node_data: the raw node graph data
/* link_data: the raw link graph data
*/
function validate(node_data, link_data) {
    var node_nums = [],
        ip_addrs = [];
    var name, node_num, ip_addr;
    for (var node in node_data) {
        if (!node_data.hasOwnProperty(node)) continue;
        for (var i = 0; i < node_data[node].length; i++) {
            var pairs = node_data[node][i];
            if (pairs.property == "Name")
                name = pairs.value;
            if (pairs.property == "Node Number")
                node_num = pairs.value;
            if (pairs.property == "IP Address")
                ip_addr = pairs.value;
        }
        node_nums.push([name, node_num]);
        ip_addrs.push([name, ip_addr]);
    }
    node_nums.sort(function (a, b) {
        return (a[1] < b[1]);
    });
    ip_addrs.sort(function (a, b) {
        return (a[1] < b[1]);
    });
    var warning = '';

    for (var i = node_nums.length - 1; i > 0; i--) {
        if (node_nums[i][1] === node_nums[i - 1][1])
            warning += `Require unique node numbers:\nDuplicates found in nodes ${node_nums[i - 1][0]} and ${node_nums[i][0]}\n\n`;
        if (ip_addrs[i][1] === ip_addrs[i - 1][1])
            warning += `Require unique IP addresses:\nDuplicates found in nodes ${ip_addrs[i - 1][0]} and ${ip_addrs[i][0]}\n\n`;
    }
    if (warning === '')
        return true;
    else {
        alert(warning);
        return false;
    }
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
