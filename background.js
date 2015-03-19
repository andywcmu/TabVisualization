/* TODO:
 * URGENT - Unable to track Shift + Ctrl + Click :(
 */


GOOGLE_SEARCH_STR = "http://www.google.com/search?q=";

/************************/
/*** VISIT ID MANAGER ***/
/************************/

var nextVisitId = 0;

/* visitIds: {key : tabId, value : visitId} */
var visitIds = {};

function getNextVisitId () {
    return nextVisitId++;
}

function setVisitId (tabId, visitId) {
    visitIds[tabId] = visitId;
}

function getVisitId (tabId) {
    if (!(tabId in visitIds)) {
        return null;
    } else {
        return visitIds[tabId];
    }
}



/******************************************/
/*** DICTIONARY REPRESENTATION OF GRAPH ***/
/******************************************/

/* The tree we construct will should follow the following invariants:
 * 1. a node may have any number of children
 * 2. a node may not have more than one parent
 * 2 implies that there's no cycle in the tree.
 */

var roots = [];

/* graph: {key : id, value : {label, url, size, children : [children id's]}} */
var graph = {};



/*******************/
/*** TAB TRACKER ***/
/*******************/

// var tabStatus = [];

var currentTabId = -1;

// function getTab (tabId) {
//     ts = tabStatus.filter(function (t) {
//         return t.id == tabId;
//     });
    
//     if (ts.length == 0) {
//         return null;
//     } else {
//         return ts[0];        
//     }
// }

function updateCurrentTabId (tabId) {
    currentTabId = tabId;
    // console.log(visitIds);
    // console.log(graph);
}

/* These listeners are used to track the tab that the user is currently
 * viewing. In other words, the tab that is currently on focus.
 */

chrome.tabs.onActivated.addListener(function (info) {
    updateCurrentTabId(info.tabId);
});

chrome.windows.onFocusChanged.addListener(function (id) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        if (tabs.length == 1) {
            /** the current focused window is a Chrome window **/

            tabId = tabs[0].id;
            updateCurrentTabId(tabId);
        }
    });

});



/*******************************/
/*** GRAPH BUILDER FUNCTIONS ***/
/*******************************/

DIA_ROOT_NODE = 30;
DIA_CHILD_NODE = 16;

function createNode (visitId, url, node_diameter) {
    graph[visitId] = {
        label : url,
        url : url,
        size : node_diameter,
        children : []
    }
}

function createLink (parentId, childId) {
    graph[parentId].children.push(childId);
}

function createChildren (parentId, childId, childUrl) {
    createNode(childId, childUrl, DIA_CHILD_NODE);
    createLink(parentId, childId);
}

function createRoot (rootId, rootUrl) { 
    createNode(rootId, rootUrl, DIA_ROOT_NODE);
    roots.push(rootId);
}



/****************************************/
/*** ADD NODE TO GRAPH FOR EACH VISIT ***/
/****************************************/

/* If a visit is caused by the following transition type, ignore the visit. */
LINK_IGNORE_TYPE = ["auto_subframe"];

/* If a visit is caused by the following transition type, this visit node
 * should branch out from its parent node (it's a child node). Otherwise, it
 * should be a new root node.
 */
LINK_CHILD_TYPE = ["link", "form_submit"];

/* Javascript has a weird "is in" implementation when checking if a string
 * is in a list of enum. I wrote this function to avoid the confusion.
 */
function isInLinkType (trans, typeList) {
    for (var i = 0; i < typeList.length; i++) {
        if (trans == typeList[i]) {
            return true;
        }
    }

    return false;
}

chrome.webNavigation.onCommitted.addListener(function (detail) {

    if (!(isInLinkType(detail.transitionType, LINK_IGNORE_TYPE))) {
        /** This is a valid visit. Prepare to add a new node **/
        
        var visitId = getNextVisitId();

        /* ???????????????? */
        // chrome.tabs.query({}, function(tabs) {
        //     tabStatus = tabs;        
        // });

        if (isInLinkType(detail.transitionType, LINK_CHILD_TYPE)) {
            // tabId = getTab(currentTabId);

            // if (tabId == null) {
            //     console.log("DEBUG: tab " + currentTabId + " cannot be found");
            // } else {
                parentVisitId = getVisitId(currentTabId);
                createChildren(parentVisitId, visitId, detail.url);
            // }
        } else {
            // console.log("commited: " + detail.url);
            createRoot(visitId, detail.url);
        }   
    
        console.log(detail);

        setVisitId(detail.tabId, visitId);        
    }

});



/*************************/
/*** UPDATE NODE LABEL ***/
/*************************/

function updateLabel (visitId, title) {
    graph[visitId].label = title;
}

/* When a node is created (onCommited), its label initially will be its url.
 * However, we want the label to be its actual web page title. Therefore,
 * when the title is loaded (we can assume this after DOM content are loaded),
 * we update the node's label to the title.
 */
chrome.webNavigation.onDOMContentLoaded.addListener(function (detail) {
    chrome.tabs.get(detail.tabId, function (tab) {
        if (tab == null) {
            console.log("DEBUG: tab is not opened");
        } else {
            var visitId = visitIds[detail.tabId];
            updateLabel(visitId, tab.title);
        }
    });
});
