/* TODO:
 * Change graph to a list
 * Write README
 */

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

/** The graph we construct will be a directed tree. **/

/* roots: [root id's] */
var roots = [];

/*
    graph: a dictionary of {
        key : visitId,
        value : {
            label : the node's label,
            url : the node's url,
            size : node's diameter in visualization,
            parent : parent's id (-1 if not exist),
            children : [children id's],
            size : size of the subtree from this node
        }
    }
*/
var graph = {};



/*******************/
/*** TAB TRACKER ***/
/*******************/

var currentTabId = -1;
var previousTabId = -1;

function updateTabIdStatus (tabId) {
    previousTabId = currentTabId;
    currentTabId = tabId;
}

/* These listeners are used to track the tab that the user is currently
 * viewing. In other words, the tab that is currently on focus.
 */

chrome.tabs.onActivated.addListener(function (info) {
    updateTabIdStatus(info.tabId);
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
            updateTabIdStatus(tabId);
        }
    });

});



/*******************************/
/*** GRAPH BUILDER FUNCTIONS ***/
/*******************************/

function createNode (visitId, parentId, url) {
    graph[visitId] = {
        label : url,
        url : url,
        parent : parentId,
        children : [],
        size : 1
    }

    /* Recursively update the size of the ancestors */
    function updateAncestorSize (visitId) {
        if (visitId >= 0) {
            graph[visitId].size += 1;
            updateAncestorSize(graph[visitId].parent);
        }
    }

    updateAncestorSize(parentId);
}

function createLink (parentId, childId) {
    graph[parentId].children.push(childId);
}

function createChildren (parentId, childId, childUrl) {
    createNode(childId, parentId, childUrl);
    createLink(parentId, childId);
}

function createRoot (rootId, rootUrl) { 
    createNode(rootId, -1, rootUrl);
    roots.push(rootId);
}



/****************************************/
/*** ADD NODE TO GRAPH FOR EACH VISIT ***/
/****************************************/

/* If a visit is caused by the following transition type, ignore the visit. */
var LINK_IGNORE_TYPE = ["auto_subframe"];

/* If a visit is caused by the following transition type, this visit node
 * should branch out from its parent node (it's a child node). Otherwise, it
 * should be a new root node.
 */
var LINK_CHILD_TYPE = ["link", "form_submit"];

var IGNORE_URL = "https://www.google.com/_/chrome/newtab";

/* If user clicks a node in the visualization, the foreground will set
 * this to the visitId of the node being clicked.
 */
var commitedVisitIdFromForegroundClick = -1;

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
    /* If the navigation is committed by user clicking a node in the
     * foreground visualization
     */
    if (commitedVisitIdFromForegroundClick >= 0) {
        setVisitId(detail.tabId, commitedVisitIdFromForegroundClick);
        commitedVisitIdFromForegroundClick = -1;

    } else if (!(isInLinkType(detail.transitionType, LINK_IGNORE_TYPE))) {
        /** This is a valid visit. Prepare to add a new node **/

        if (isInLinkType(detail.transitionType, LINK_CHILD_TYPE)) {
            
            if (currentTabId in visitIds) {
                var parentVisitId = getVisitId(currentTabId);
            
            /* HACK: I can't think of a good way to keep track of previous
             * tab when user open a link with Ctrl + Shift + Click.
             * I just hack it this way to recognize the case.
             */
            } else {
                var parentVisitId = getVisitId(previousTabId);
            }

            var visitId = getNextVisitId();
            createChildren(parentVisitId, visitId, detail.url);
        } else {

            /* If the new page commited should be ignored (like new tab page) */
            if (detail.url.slice(0, IGNORE_URL.length) == IGNORE_URL) {
                var visitId = -1;
                
            } else {
                var visitId = getNextVisitId();
                createRoot(visitId, detail.url);
            }
        }   
    
        setVisitId(detail.tabId, visitId);        
    }

});



/*************************/
/*** UPDATE NODE LABEL ***/
/*************************/

function updateLabel (visitId, title) {
    if (visitId in graph) {
        graph[visitId].label = title;
    }
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
