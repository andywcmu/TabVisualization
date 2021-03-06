var WHITE = "#FFFFFF"
var GREEN1 = "#C9FFF0"
var GREEN2 = "#A6FFE6"
var GREEN3 = "#12FFBC"

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

var visitIdToNodeId = {};

var currentVisitId = bg.visitIds[bg.currentTabId];

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

function createNode (visitId, diameter) {
    var node = {
        visitId : visitId,
        label : bg.graph[visitId].label,
        url : bg.graph[visitId].url,
        diameter : diameter,
        size : bg.graph[visitId].size,
        distanceToCurrent : -1
    }

    nodes.push(node);

    var nodeId = nodes.length - 1;
    visitIdToNodeId[visitId] = nodeId;

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

function expandNode (nodeId, isInitExpand, childVisitIdOnPathToTargetNode) {
    var node = nodes[nodeId];
    node.size = 1;
    
    bgNode = bg.graph[node.visitId];
    for (var i = 0; i < bgNode.children.length; i++) {
        var childNodeId = createNode(bgNode.children[i], DIA_CHILD_NODE);

        links.push({
            source : nodeId,
            target : childNodeId,
            // content : contentNodes,
            weight : 1,
            isPathToCurrent : nodes[childNodeId].visitId == childVisitIdOnPathToTargetNode
        });

    }

    if (!isInitExpand) {
        updateGraph(nodeId);
    }
}

// function expandGraph (visitId, depth) {
//     /* DEBUG PURPOSE */
//     if (depth > 1000) {
//         console.log("DEBUG: infinite loop");
//         return [[], -1];
//     }

//     var bgNode = bg.graph[visitId];
//     var fgNodeId = createNode(bgNode, depth == 0 ? DIA_ROOT_NODE : DIA_CHILD_NODE);
    
//     for (var i = 0; i < bgNode.children.length; i++) {
//         var retval = expandGraph(bgNode.children[i], depth + 1);
//         var contentNodes = retval[0];
//         var endNodeId = retval[1];

//         links.push({
//             source : fgNodeId,
//             target : endNodeId,
//             content : contentNodes,
//             weight : 1
//         });
//     }

//     return [[], fgNodeId];
// }

function expandPathFromCurrentToRoot (visitId, childVisitId, depth) {
    var parentVisitId = bg.graph[visitId].parent;

    if (parentVisitId >= 0) {
        expandPathFromCurrentToRoot(parentVisitId, visitId, depth + 1);
    }

    var nodeId = visitIdToNodeId[visitId];
    nodes[nodeId].distanceToCurrent = depth;
    expandNode(nodeId, true, childVisitId);
}

function buildGraph (chainThreshold) {
    for (var i = 0; i < bg.roots.length; i++) {
        createNode(bg.roots[i], DIA_ROOT_NODE);
    }

    if (currentVisitId >= 0) {
        expandPathFromCurrentToRoot(currentVisitId, -1, 0);
    }
}

buildGraph();


/***********************/
/*** VISUALIZE GRAPH ***/
/***********************/

var graphContainerW = 800, graphContainerH = 600;

var zoomListener = d3.behavior
    .zoom()
    .scaleExtent([0.1, 3])
    .on("zoom", function () {
        graph.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    });

var graphContainer = d3.select("#graph_container")
    .append("svg:svg")
    .attr("width", graphContainerW)
    .attr("height", graphContainerH)
    .call(zoomListener);

var graph = graphContainer.append("g");

var force = d3.layout.force()
    .size([graphContainerW, graphContainerH])
    .nodes(nodes)
    .links(links)
    .gravity(0.2)
    .linkDistance(50)
    .charge(-3000)
    .linkStrength(function (x) {
        return x.weight * 1
    });

force.start();

var force2 = d3.layout
    .force()
    .nodes(labelAnchors)
    .links(labelAnchorLinks)
    .gravity(0)
    .linkDistance(25)
    .linkStrength(8)
    .charge(-100)
    .size([graphContainerW, graphContainerH]);

force2.start();

function drawLinks (scope) {
    scope.enter().insert("line", ".node")
        .attr("class", "link")
        .style("stroke", function (d, i) {
            return links[i].isPathToCurrent ? GREEN3 : WHITE;
        })
        .style("stroke-width", 3);
}

function drawNodes (scope) {
    var n = scope
        .enter()
        .append("svg:g")
        .attr("class", "node");

    n.append("svg:circle")
        .attr("r", function (d, i) {
            return nodes[i].diameter;
        })
        .style("fill", GREEN1)
        .style("-webkit-animation", function (d, i) {
            if (nodes[i].distanceToCurrent >= 0) {
                return "currentNodeAnimation" + (nodes[i].distanceToCurrent % 5) + " 0.8s infinite";
            } else {
                return "initial";
            }
        })
        .style("stroke", function (d, i) {
            return nodes[i].distanceToCurrent >= 0 ? GREEN3 : WHITE;
        })
        .style("stroke-width", 3);
        

    n.append("text")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .style("fill", "#FFFFFF")
        .text(function (d, i) {
            return nodes[i].size > 1 ? nodes[i].size.toString() : "";
        });
}

function drawAnchorNodes (scope) {
    var an = scope
        .enter()
        .append("svg:g")
        .attr("class", "anchorNode");

    an.append("svg:circle")
        .attr("r", 0)
        .style("fill", "#FFF");

    an.append("svg:text")
        .text(function(d, i) {
            return i % 2 == 0 ? "" : d.node.label
        })
        .style("fill", "#888888")
        .style("font-family", "Arial")
        .style("font-size", 12);
}

function updateMouseAction () {
    node.on("click", function (d, i) {
        if (nodes[i].size <= 1) {
            bg.commitedVisitIdFromForegroundClick = nodes[i].visitId;

            chrome.tabs.create({
                url: nodes[i].url
            });
        } else {
            // updateCurrentNodeTarget(i);
            
            d3.select(this)
                .select('text')
                .text("");
            
            expandNode(i, false, -1);

            // currentNodeId = i;
        }
    });
}

function updateGraph(expandId) {
    link = link.data(links);
    drawLinks(link);

    node = node.data(nodes);
    drawNodes(node);

    anchorLink = anchorLink.data(labelAnchorLinks);

    anchorNode = anchorNode.data(labelAnchors);
    drawAnchorNodes(anchorNode);

    updateMouseAction();

    force.start();
}

var link = graph.selectAll("line.link").data(links);
drawLinks(link);

var node = graph.selectAll("g.node").data(nodes);
drawNodes(node);

var anchorLink = graph.selectAll("line.anchorLink").data(labelAnchorLinks);

var anchorNode = graph.selectAll("g.anchorNode").data(labelAnchors);
drawAnchorNodes(anchorNode);

updateMouseAction();


/******************************************/
/*** NODE & LINK POSITION RELATED STUFF ***/
/******************************************/

var currentNodeId = visitIdToNodeId[currentVisitId];
var currentNodeX = graphContainerW / 2;
var currentNodeY = graphContainerH / 2;

var currentNodeTargetX = graphContainerW / 2;
var currentNodeTargetY = graphContainerH / 2;

function getRelatedTranslateX (x) {
    return x - currentNodeX + currentNodeTargetX;
}

function getRelatedTranslateY (y) {
    return y - currentNodeY + currentNodeTargetY;
}

function updateCurrentNode () {
    node.each(function(d, i) {
        if (i == currentNodeId) {
            currentNodeX = d.x;
            currentNodeY = d.y;
        }
        if (i == 6) {
            console.log(d);
        }
        
    });
}

// function updateCurrentNodeTarget (nodeId) {
//     node.each(function(d, i) {
//         if (i == nodeId) {
            
//             var scale = zoomListener.scale();
//             var translate = zoomListener.translate();
//             console.log(translate);
//             // currentNodeTargetX = 10 - translate[0];
//             // currentNodeTargetY = 10 - translate[1];
//             // zoomListener.translate([d.x, y]);
//         }
//     });
// }

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

    updateCurrentNode();

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

