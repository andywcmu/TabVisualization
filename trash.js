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

node.on("click", function(d, i){
    chrome.tabs.create({url: bg.nodes[i].url});
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