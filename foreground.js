/* get information from background.js */
var bg = chrome.extension.getBackgroundPage();

/************************************/
/*** CONTRACT GRAPH (SIMPLIFY IT) ***/
/************************************/

/* We decide to contract the graph at the time the extension is clicked,
 * instead of doing it in the background everytime a new webpage is opened.
 * This may not be a good idea since doing heavy computation on foreground
 * causing the visualization taking a long time to be shown makes users think
 * it's our fault. On the other hand, doing heavy computation on background
 * makes users think it's Chrome's fault. Lol.
 * But we're honest human beings.
 */

/* Graph used by foreground. Need to be lists to conform with D3 standards. */
var nodes = [];
var labelAnchors = [];
var labelAnchorLinks = [];
var links = [];

/* DFS using recursion. This assumes that the graph from background has
 * no cycle or we're fucked (and yes we constructed the background graph to
 * have no cycle. see background.js).
 */

/* TODO: use iterative method instead (queue) since
 * there may be tons of webpages opened.
 */

var DIA_ROOT_NODE = 30;
var DIA_CHILD_NODE = 16;

var CHAIN_THRESHOLD = 1

function createNode (bgNode, diameter) {
    var node = {
        label : bgNode.label,
        url : bgNode.url,
        diameter : diameter
    }

    nodes.push(node);

    var nodeId = nodes.length - 1;

    /** Add label **/

    /* create anchor nodes */
    for (var i = 0; i < 2; i++) {
        labelAnchors.push({
            node : node
        });
    }

    /* link the anchor nodes */
    labelAnchorLinks.push({
        source : nodeId * 2,
        target : nodeId * 2 + 1,
        weight : 1
    });

    return nodeId;
}

function expandGraph (visitId, depth) {
    /* DEBUG PURPOSE */
    if (depth > 1000) {
        console.log("DEBUG: infinite loop");
        return [[], -1];
    }

    var bgNode = bg.graph[visitId];
    var fgNodeId = createNode(bgNode, depth == 0 ? DIA_ROOT_NODE : DIA_CHILD_NODE);
    
    for (var i = 0; i < bgNode.children.length; i++) {
        var retval = expandGraph(bgNode.children[i], depth + 1);
        var contentNodes = retval[0];
        var endNodeId = retval[1];

        links.push({
            source : fgNodeId,
            target : endNodeId,
            content : contentNodes,
            weight : 1
        });
    }

    return [[], fgNodeId];
}

function buildContractedGraph (chainThreshold) {
    for (rootId in bg.roots) {
        expandGraph(rootId, 0);
    }
}

buildContractedGraph();



/***********************/
/*** VISUALIZE GRAPH ***/
/***********************/

var graphContainerW = 800, graphContainerH = 600;

var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", function () {
    graph.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
});

var graphContainer = d3.select("#graph_container").append("svg:svg").attr("width", graphContainerW).attr("height", graphContainerH).call(zoomListener);;

var graph = graphContainer.append("g");



var force = d3.layout.force().size([graphContainerW, graphContainerH]).nodes(nodes).links(links).gravity(0.2).linkDistance(100).charge(-3000).linkStrength(function(x) {
    return x.weight * 1
});

force.start();

var force2 = d3.layout.force().nodes(labelAnchors).links(labelAnchorLinks).gravity(0).linkDistance(25).linkStrength(8).charge(-100).size([graphContainerW, graphContainerH]);
force2.start();



var link = graph.selectAll("line.link").data(links).enter().append("svg:line").attr("class", "link").style("stroke", "#FFFFFF").style("stroke-width", 3);

var node = graph.selectAll("g.node").data(force.nodes()).enter().append("svg:g").attr("class", "node");
node.append("svg:circle").attr("r", function(d, i){return nodes[i].diameter;}).style("fill", function(d, i){return "#EEEEEE"; /*bg.current.nodeId == i ? "#A3D900" : "#EEEEEE";*/}).style("stroke", "#FFFFFF").style("stroke-width", 3);

var anchorLink = graph.selectAll("line.anchorLink").data(labelAnchorLinks)//.enter().append("svg:line").attr("class", "anchorLink").style("stroke", "#999");

var anchorNode = graph.selectAll("g.anchorNode").data(force2.nodes()).enter().append("svg:g").attr("class", "anchorNode");
anchorNode.append("svg:circle").attr("r", 0).style("fill", "#FFF");
anchorNode.append("svg:text").text(function(d, i) {
    return i % 2 == 0 ? "" : d.node.label
}).style("fill", "#555").style("font-family", "Arial").style("font-size", 12);


function urlHash (url) {
    return url.match(/^[^\#]+/)[0];
}



/******************************************/
/*** NODE & LINK POSITION RELATED STUFF ***/
/******************************************/

var currentNodeX = graphContainerW / 2;
var currentNodeY = graphContainerH / 2;

function getRelatedTranslateX (x) {
    return x - currentNodeX + (graphContainerW / 2);
}

function getRelatedTranslateY (y) {
    return y - currentNodeY + (graphContainerH / 2);
}

function updateCurrentNode () {
    // node.each(function(d, i) {
    //     if (i == bg.current.nodeId) {
    //         currentNodeX = d.x;
    //         currentNodeY = d.y;
    //     }
    // });
}

function updateNode () {
    this.attr("transform", function(d, i) {
        return "translate(" + getRelatedTranslateX(d.x) + "," + getRelatedTranslateY(d.y) + ")";        
    });
}

function updateLink () {
    this.attr("x1", function(d) {
        return getRelatedTranslateX(d.source.x);
    }).attr("y1", function(d) {
        return getRelatedTranslateY(d.source.y);
    }).attr("x2", function(d) {
        return getRelatedTranslateX(d.target.x);
    }).attr("y2", function(d) {
        return getRelatedTranslateY(d.target.y);
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






updateCurrentNode();

