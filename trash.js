/* Codes that are no longer being used. Archive purpose only. */



        // if (depth > 100) {
        //     console.log("DEBUG: infinite loop");
        //     return [[], -1];
        // }

        // if (node.children.length == 1) {
        //     ret = expandGraph(node.children[0], depth + 1);
        //     contentNodes = ret[0];
        //     endNodeId = ret[1];
        //     contentNodes.push(node);
        //     return [contentNodes, endNodeId];
        // } else {
        //     /* This node should not be contracted into a super link */
        //     var nodeId = createNode(node);

        //     for (child in node.children) {
        //         ret = expandGraph(child, depth + 1);
        //         contentNodes = ret[0];
        //         endNodeId = ret[1];

        //         links.push({
        //             source : nodeId,
        //             target : endNodeId,
        //             content : contentNodes,
        //             weight : 1
        //         });
        //     }
            
        //     return [[], nodeId];
        // }

var node = {
    label : "node " + bg.counter
};
bg.nodes.push(node);
bg.labelAnchors.push({
    node : node
});
bg.labelAnchors.push({
    node : node
});

if (bg.counter > 0) {
    bg.links.push({
        source : bg.counter - 1,
        target : bg.counter,
        weight : Math.random()
    });
}
    bg.labelAnchorLinks.push({
        source : bg.counter * 2,
        target : bg.counter * 2 + 1,
        weight : 1
    });
}

for(var j = 0; j < bg.counter; j++) {
    // if(Math.random() > .95)
        bg.links.push({
            source : bg.counter,
            target : j,
            weight : Math.random()
        });
}

bg.labelAnchorLinks.push({
    source : bg.counter * 2,
    target : bg.counter * 2 + 1,
    weight : 1
});

bg.counter++;





function centerNode(n) {
    scale = zoomListener.scale();
    x = -n.x;
    y = -n.y;
    x = x * scale + graphContainerW / 2;
    y = y * scale + graphContainerH / 2;
    d3.select('g').transition()
        // .duration(duration)
        .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
    zoomListener.scale(scale);
    zoomListener.translate([x, y]);
}

var anchorLink = graph.selectAll("line.anchorLink")
    .data(labelAnchorLinks);
    // .enter()
    // .append("svg:line")
    // .attr("class", "anchorLink")
    // .style("stroke", "#999");




GOOGLE_SEARCH_STR = "http://www.google.com/search?q=";


chrome.omnibox.onInputEntered.addListener(function (info) {
    chrome.tabs.update({
        url: GOOGLE_SEARCH_STR + info
    });
});




node.on("click", function (d, i) {
    if (nodes[i].size <= 1) {
        chrome.tabs.create({
            url: bg.graph[i].url
        });
    } else {
        expandNode(i);
    }
    
    // centerNode(d);
    /* Should check if the url already exists in one of the tabs first
     * if yes, switch to that tab. otherwise open a new tab with that url.
     * Work on this later!
     */
    // chrome.tabs.query({}, function (tabs){
    //     for (var j = 0; j < tabs.length; j++) {
    //         chrome.tabs.get(tabs[j].id, function (tab) {
    //             console.log(urlHash(bg.nodes[i].url));
    //             if ("https://instagram.com" == urlHash(bg.nodes[i].url)) {
    //                 chrome.tabs.highlight(tab.id);
    //                 console.log("HIGHLIGHT "+tab.id);
    //             }
    //         });
    //     }
    // });
});


function urlHash (url) {
    return url.match(/^[^\#]+/)[0];
}

function updateCurrentNodeID (tabId) {
    tab = getTab(tabId);

    if (tab != null) {
        url = urlHash(tab.url);
        console.log(url);
        current.nodeId = (url in sites) ? sites[url].index : -1;
    }
}



function getTab (tabId) {
    ts = tabStatus.filter(function (t) {
        return t.id == tabId;
    });
    
    if (ts.length == 0) {
        return null;
    } else {
        return ts[0];        
    }
}