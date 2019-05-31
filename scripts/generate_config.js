/*
 * This function handles the generating the text that would go into the different configuration files.
 * The information returned is an object that goes from the node name to a pair where
 * Example: {node1: [["global.rc","contents of global.rc"],["node1.bprc","bprc text in here"],etc...]}
 */
function generateConfig(prefix, basic, adv) {
    var config_files = {};
    var node_list = basic['node_numbers_and_IP'];
    for (var num in node_list) {
        if (!node_list.hasOwnProperty(num)) continue;
        name = prefix + num;
        config_files[name] = [];
        config_files[name].push(generate_ionrc(prefix, num, basic, adv));
        config_files[name].push(generate_ionconfig(prefix, num, basic, adv));
        config_files[name].push(generate_ionsecrc(prefix, num, basic, adv));
        config_files[name].push(generate_ltprc(prefix, num, basic, adv));
        config_files[name].push(generate_bprc(prefix, num, basic, adv));
        config_files[name].push(generate_ipnrc(prefix, num, basic, adv));
        config_files[name].push(generate_cfdprc(prefix, num, basic, adv));
        config_files[name].push(generate_globalrc(basic, adv));
        config_files[name].push(generate_ionstart(prefix, num));
        config_files[name].push(generate_ionstop());
    }
    return config_files;
}

function generate_ionrc(prefix, num, basic, adv) {
    var content = [];
    if (adv['DEFAULT']) {
        content.push('1 ' + num)
    }
    else {
        content.push('1 ' + num + ' ' + prefix + num + '.ionconfig')
    }
    content.push('s')
    return [prefix + num + '.ionrc', content.join('\n')];
}

function generate_ionconfig(prefix, num, basic, adv) {
    var content = [];
    if (adv['DEFAULT']) {
        // Nothing for now
    }
    return [prefix + num + '.ionconfig', content.join('\n')]
}

function generate_ionsecrc(prefix, num, basic, adv) {
    var content = ["1"];
    return [prefix + num + '.ionsecrc', content.join('\n')]
}

function generate_ltprc(prefix, num, basic, adv) {
    var content = [];
    if (adv['DEFAULT']) {
        content.push("1 " + (32 * (Object.keys(basic['node_numbers_and_IP']).length)));
        for (var i = 0; i < basic['edge_list'][num].length; i++) {
            var dest = basic['edge_list'][num][i]
            if (dest[1].toLowerCase() == 'ltp') {
                content.push(
                    `a span ${dest[0]} 32 32 64000 1 1 'udplso ${basic['node_numbers_and_IP'][dest[0]]} 10000000'`
                )
            }
        }
        content.push("w 1")
        content.push(`s 'udplsi ${basic['node_numbers_and_IP'][num]}'`)
    }
    return [prefix + num + '.ltprc', content.join('\n')];
}

function find_all_layers(node, basic, adv) {
    var induct = new Set();
    var outduct = new Set();
    var edge_list = basic['edge_list'];
    for (var src in edge_list) {
        if (!edge_list.hasOwnProperty(src)) continue;
        var dests = edge_list[src];
        if (src === node) {
            for (var i = 0; i < dests.length; i++)
                induct.add(dests[i][1])
        }
        else {
            for (var i = 0; i < dests.length; i++) {
                var dest = dests[i];
                if (dest[0] === node)
                    outduct.add(dest[1]);
            }
        }
    }
    return [induct, outduct];
}

function generate_bprc(prefix, num, basic, adv) {
    var content = ["1"];
    if (adv['DEFAULT']) {
        content.push("a scheme ipn 'ipnfw' 'ipnadminep'")
        for (var i = 0; i < 128; i++)
            content.push(`a endpoint ipn:${num}.${i} x`);
        var io_pair = find_all_layers(num, basic, adv);
        var induct = io_pair[0],
            outduct = io_pair[1];
        var union = new Set([...induct, ...outduct]);
        union.forEach(function (layer) {
            content.push(`a protocol ${layer.toLowerCase()} 1400 100`)
        });
        induct.forEach(function (layer) {
            if (layer.toLowerCase() === 'ltp')
                content.push(`a induct ltp ${num} ltpcli`);
            else
                content.push(`a induct ${layer.toLowerCase()} ${basic['node_numbers_and_IP'][num]} ${layer.toLowerCase()}cli`);
        });
        for (var i = 0; i < basic['edge_list'][num].length; i++) {
            var pair = basic['edge_list'][num][i];
            if (pair[1].toLowerCase() === 'ltp')
                content.push(`a outduct ltp ${pair[0]} ltpclo`);
            else if (pair[1].toLowerCase() === 'udp')
                content.push("a outduct udp * udpclo");
            else
                content.push(`a outduct tcp ${basic['node_numbers_and_IP'][pair[0]]} tcpclo`);
        }
        content.push(`r 'ipnadmin ${prefix + num}.ipnrc'`);
        content.push("w 1")
        content.push("s")
    }
    return [prefix + num + '.bprc', content.join('\n')];
}

function bfs_plans_exits(node, adj_list) {
    var plans = []; // list of pairs (neighboring nodes and their protocol)
    var exits = []; // list of pairs (node it can reach, node to route through)
    var queue = [];
    var seen = new Set();
    seen.add(node);
    for (var i = 0; i < adj_list[node].length; i++) {
        var neighbor = adj_list[node][i]
        queue.push([neighbor[0], neighbor[0]])
        plans.push([neighbor[0], neighbor[1]])
        seen.add(neighbor[0])
    }
    while (queue.length > 0) {
        var node_to_check = queue.pop()
        var neighbors = adj_list[node_to_check[0]];
        for (var i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];
            if (seen.has(neighbor[0]))
                continue;
            queue.push([neighbor[0], node_to_check[1]])
            exits.push([neighbor[0], node_to_check[1]])
            seen.add(neighbor[0])
        }
    }
    return [plans, exits];
}

function generate_ipnrc(prefix, num, basic, adv) {
    var content = [];
    if (adv['DEFAULT']) {
        var plans_exits = bfs_plans_exits(num, basic['edge_list'])
        var plans = plans_exits[0];
        var exits = plans_exits[1];
        for (var i = 0; i < plans.length; i++) {
            var plan = plans[i];
            if (plan[1].toLowerCase() == 'ltp')
                content.push(`a plan ${plan[0]} ltp/${plan[0]}`);
            else if (plan[1].toLowerCase() == 'udp')
                content.push(`a plan ${plan[0]} udp/*,${basic['node_numbers_and_IP'][plan[0]]}`);
            else
                content.push(`a plan ${plan[0]} tcp/${basic['node_numbers_and_IP'][plan[0]]}`);
        }
        for (var i = 0; i < exits.length; i++) {
            var exit = exits[i];
            content.push(`a exit ${exit[0]} ${exit[0]} ipn:${exit[1]}.0`);
        }
    }
    return [prefix + num + '.ipnrc', content.join('\n')];
}

function generate_cfdprc(prefix, num, basic, adv) {
    var content = ["1"]
    content.push("w 1")
    content.push("m requirecrc 1")
    content.push("s bputa")
    if (!adv['DEFAULT']) {
        // do nothing yet
    }
    return [prefix + num + '.cfdrc', content.join('\n')];
}

function generate_globalrc(basic, adv) {
    var content = [];
    if (adv['DEFAULT']) {
        for (var src in basic['edge_list']) {
            if (!basic['edge_list'].hasOwnProperty(src)) continue;
            var dests = basic['edge_list'][src]
            for (var i = 0; i < dests.length; i++) {
                var dest = dests[i];
                if (src < dest[0])
                    content.push(`a range +0 +345600 ${src} ${dest[0]} 4`);
            }
        }
        for (var src in basic['edge_list']) {
            if (!basic['edge_list'].hasOwnProperty(src)) continue;
            var dests = basic['edge_list'][src]
            for (var i = 0; i < dests.length; i++) {
                var dest = dests[i];
                content.push(`a contact +0 +345600 ${src} ${dest[0]} 10000000`);
            }
        }
    }
    return ['global.rc', content.join('\n')];
}

function generate_ionstart(prefix, num) {
    var name = prefix + num;
    var content = "#!/bin/bash\n \
        # shell script to get node running\n \
        rm ion.log\n \
        sleep 1\n \
        ionadmin        "+ name + ".ionrc\n \
        sleep 1\n \
        ionsecadmin     "+ name + ".ionsecrc\n \
        sleep 1\n \
        ltpadmin        "+ name + ".ltprc\n \
        sleep 1\n \
        bpadmin         "+ name + ".bprc\n \
        sleep 1\n \
        cfdpadmin       "+ name + ".cfdprc\n \
        sleep 1\n \
        ionadmin        global.rc\n \
        sleep 1\n \
        bpecho ipn:"+ num + ".3 &\n";
    return ['ionstart', content];
}

function generate_ionstop() {
    var content = `#!/bin/sh
echo "IONSTOP will now stop ion and clean up the node for you..."
echo "bpadmin ."
bpadmin .
sleep 1
echo "cfdpadmin ."
cfdpadmin .
sleep 1
echo "ltpadmin ."
ltpadmin .
sleep 1
echo "ionadmin ."
ionadmin .
sleep 1
echo "global.rc ."
ionadmin .
sleep 1
echo "killm"
killm
echo "ION node ended. Log file: ion.log`;
    return ['ionstop', content];
}