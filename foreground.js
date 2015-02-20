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

var graphContainerW = 500, graphContainerH = 500;

var labelDistance = 0;



var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", function () {
    graph.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
});


var graphContainer = d3.select("#graph_container").append("svg:svg").attr("width", graphContainerW).attr("height", graphContainerH).call(zoomListener);;

var graph = graphContainer.append("g");






var force = d3.layout.force().size([graphContainerW, graphContainerH]).nodes(bg.nodes).links(bg.links).gravity(1).linkDistance(50).charge(-3000).linkStrength(function(x) {
    return x.weight * 10
});

force.start();

var force2 = d3.layout.force().nodes(bg.labelAnchors).links(bg.labelAnchorLinks).gravity(0).linkDistance(50).linkStrength(8).charge(-100).size([graphContainerW, graphContainerH]);
force2.start();



var link = graph.selectAll("line.link").data(bg.links).enter().append("svg:line").attr("class", "link").style("stroke", "#CCC");

var node = graph.selectAll("g.node").data(force.nodes()).enter().append("svg:g").attr("class", "node");
node.append("svg:circle").attr("r", 16).style("fill", "#555").style("stroke", "#FFF").style("stroke-width", 3);

var anchorLink = graph.selectAll("line.anchorLink").data(bg.labelAnchorLinks)//.enter().append("svg:line").attr("class", "anchorLink").style("stroke", "#999");

var anchorNode = graph.selectAll("g.anchorNode").data(force2.nodes()).enter().append("svg:g").attr("class", "anchorNode");
anchorNode.append("svg:circle").attr("r", 0).style("fill", "#FFF");
anchorNode.append("svg:text").text(function(d, i) {
    return i % 2 == 0 ? "" : d.node.label
}).style("fill", "#555").style("font-family", "Arial").style("font-size", 12);

var updateLink = function() {
    this.attr("x1", function(d) {
        return d.source.x;
    }).attr("y1", function(d) {
        return d.source.y;
    }).attr("x2", function(d) {
        return d.target.x;
    }).attr("y2", function(d) {
        return d.target.y;
    });

}

var updateNode = function() {
    this.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
    });

}


force.on("tick", function() {

    force2.start();

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
        }
    });


    anchorNode.call(updateNode);

    link.call(updateLink);
    anchorLink.call(updateLink);

});