var bg = chrome.extension.getBackgroundPage();

// var node = {
//     label : "node " + bg.counter
// };
// bg.nodes.push(node);
// bg.labelAnchors.push({
//     node : node
// });
// bg.labelAnchors.push({
//     node : node
// });

// if (bg.counter > 0) {
//     bg.links.push({
//         source : bg.counter - 1,
//         target : bg.counter,
//         weight : Math.random()
//     });
// }
//     bg.labelAnchorLinks.push({
//         source : bg.counter * 2,
//         target : bg.counter * 2 + 1,
//         weight : 1
//     });
// }

// for(var j = 0; j < bg.counter; j++) {
//     // if(Math.random() > .95)
//         bg.links.push({
//             source : bg.counter,
//             target : j,
//             weight : Math.random()
//         });
// }

// bg.labelAnchorLinks.push({
//     source : bg.counter * 2,
//     target : bg.counter * 2 + 1,
//     weight : 1
// });

// bg.counter++;

var graphContainerW = 800, graphContainerH = 600;

// var labelDistance = 0;



var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", function () {
    graph.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
});


var graphContainer = d3.select("#graph_container").append("svg:svg").attr("width", graphContainerW).attr("height", graphContainerH).call(zoomListener);;

var graph = graphContainer.append("g");






var force = d3.layout.force().size([graphContainerW, graphContainerH]).nodes(bg.nodes).links(bg.links).gravity(0.2).linkDistance(100).charge(-3000).linkStrength(function(x) {
    return x.weight * 1
});

force.start();

var force2 = d3.layout.force().nodes(bg.labelAnchors).links(bg.labelAnchorLinks).gravity(0).linkDistance(25).linkStrength(8).charge(-100).size([graphContainerW, graphContainerH]);
force2.start();



var link = graph.selectAll("line.link").data(bg.links).enter().append("svg:line").attr("class", "link").style("stroke", "#FFFFFF").style("stroke-width", 3);

var node = graph.selectAll("g.node").data(force.nodes()).enter().append("svg:g").attr("class", "node");
node.append("svg:circle").attr("r", function(d, i){return bg.nodes[i].size;}).style("fill", function(d, i){return bg.current.nodeId == i ? "#A3D900" : "#EEEEEE";}).style("stroke", "#FFFFFF").style("stroke-width", 3);

var anchorLink = graph.selectAll("line.anchorLink").data(bg.labelAnchorLinks)//.enter().append("svg:line").attr("class", "anchorLink").style("stroke", "#999");

var anchorNode = graph.selectAll("g.anchorNode").data(force2.nodes()).enter().append("svg:g").attr("class", "anchorNode");
anchorNode.append("svg:circle").attr("r", 0).style("fill", "#FFF");
anchorNode.append("svg:text").text(function(d, i) {
    return i % 2 == 0 ? "" : d.node.label
}).style("fill", "#555").style("font-family", "Arial").style("font-size", 12);


function urlHash (url) {
    return url.match(/^[^\#]+/)[0];
}

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

// var currentNode = graph.selectAll("g.node")[bg.current.nodeId];
// centerNode(currentNode);




// var updateLink = function() {
//     this.attr("x1", function(d) {
//         return d.source.x;
//     }).attr("y1", function(d) {
//         return d.source.y;
//     }).attr("x2", function(d) {
//         return d.target.x;
//     }).attr("y2", function(d) {
//         return d.target.y;
//     });

// }

var updateLink = function() {
    this.attr("x1", function(d) {
        // return d.source.x - currentNodeX + (graphContainerW / 2);
        return getRelatedTranslateX(d.source.x);
    }).attr("y1", function(d) {
        return getRelatedTranslateY(d.source.y);
        // return d.source.y - currentNodeY + (graphContainerH / 2);
    }).attr("x2", function(d) {
        return getRelatedTranslateX(d.target.x);
        // return d.target.x - currentNodeX + (graphContainerW / 2);
    }).attr("y2", function(d) {
        return getRelatedTranslateY(d.target.y);
        // return d.target.y - currentNodeY + (graphContainerH / 2);
    });
}



var currentNodeX = graphContainerW / 2;
var currentNodeY = graphContainerH / 2;

// function getRelatedTranslate (x, y) {
//     relatedX = x - currentNodeX + (graphContainerW / 2);
//     relatedY = y - currentNodeY + (graphContainerH / 2);
    
//     return "translate(" + relatedX + "," + relatedY + ")";
// }

function getRelatedTranslateX (x) {
    return x - currentNodeX + (graphContainerW / 2);
}

function getRelatedTranslateY (y) {
    return y - currentNodeY + (graphContainerH / 2);
}

var updateNode = function() {
    this.attr("transform", function(d, i) {
        return "translate(" + getRelatedTranslateX(d.x) + "," + getRelatedTranslateY(d.y) + ")";        


        // return getRelatedTranslate(d.x, d.y);

        // relatedX = d.x - currentNodeX + (graphContainerW / 2);
        // relatedY = d.y - currentNodeY + (graphContainerH / 2);

        // return "translate(" + d.x + "," + d.y + ")";
        // return "translate(" + relatedX + "," + relatedY + ")";
    });

}


force.on("tick", function() {

    console.log("" + currentNodeX + "  " + currentNodeY);

    force2.start();

    node.each(function(d, i) {
        if (i == bg.current.nodeId) {
            currentNodeX = d.x;
            currentNodeY = d.y;
        }
    });

    node.call(updateNode);

    anchorNode.each(function(d, i) {
        if(i % 2 == 0) {
            d.x = d.node.x;
            d.y = d.node.y;
        } else {
            var b = this.childNodes[1].getBBox();

            var diffX = d.x - d.node.x;
            var diffY = d.y - d.node.y;

            var dist = Math.sqrt(diffX * diffX + diffY * diffY);

            var shiftX = b.width * (diffX - dist) / (dist * 2);
            shiftX = Math.max(-b.width, Math.min(0, shiftX));
            var shiftY = 5;
            this.childNodes[1].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
            // this.childNodes[1].setAttribute("transform", getRelatedTranslate(shiftX, shiftY));

        }
    });


    anchorNode.call(updateNode);

    link.call(updateLink);
    anchorLink.call(updateLink);
});