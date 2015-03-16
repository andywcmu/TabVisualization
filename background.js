GOOGLE_SEARCH_STR = "http://www.google.com/search?q=";

var counter = 0;

/* url: {title, index} */
var sites = {};

var nodes = [];
var labelAnchors = [];
var labelAnchorLinks = [];
var links = [];

var tabStatus = [];

var current = {'tabId': -1, 'nodeId': -1};

function urlHash (url) {
    return url.match(/^[^\#]+/)[0];
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

function updateCurrentTabID (tabId) {
    current.tabId = tabId;
}

function updateCurrentNodeID (tabId) {
    tab = getTab(tabId);

    if (tab != null) {
        url = urlHash(tab.url);
        console.log(url);
        current.nodeId = (url in sites) ? sites[url].index : -1;
    }
}

DIA_ROOT_NODE = 30;
DIA_CHILD_NODE = 16;

function createNode (url, node_diameter) {
    url = urlHash(url);
    if (url in sites) {
        node = nodes[sites[url].index];
        if (node.size < node_diameter) {
            node.size = node_diameter;
        }
    } else {
        node = {
            label : url,
            url : url,
            size : node_diameter
        };

        nodes.push(node);

        for (var i = 0; i < 2; i++) {
            labelAnchors.push({
                node : node
            });
        }

        labelAnchorLinks.push({
            source : (nodes.length - 1) * 2,
            target : (nodes.length - 1) * 2 + 1,
            weight : 1
        });
        
        sites[url] = {title : url,
                      index : nodes.length - 1};
    }
}

function createLink (parentUrl, childUrl) {
    parentUrl = urlHash(parentUrl);
    childUrl = urlHash(childUrl);

    if ((parentUrl in sites) && (childUrl in sites)) {
        console.log(sites[parentUrl].index + " " + sites[childUrl].index);
        links.push({
            source : sites[parentUrl].index,
            target : sites[childUrl].index,
            weight : 1
        });
    }
}

function createChildren (parentUrl, childUrl) {
    createNode(childUrl, DIA_CHILD_NODE);
    createLink(parentUrl, childUrl);
}

function createRoot (url) { 
    createNode(url, DIA_ROOT_NODE);
}


LINK_IGNORE_TYPE = ["auto_subframe"];
LINK_CHILD_TYPE = ["link", "form_submit"];

function inLinkType (trans, typeList) {
    for (var i = 0; i < typeList.length; i++) {
        if (trans == typeList[i]) {
            return true;
        }
    }

    return false;
}

chrome.webNavigation.onCommitted.addListener(function (detail) {

    if (!(inLinkType(detail.transitionType, LINK_IGNORE_TYPE))) {
        if (inLinkType(detail.transitionType, LINK_CHILD_TYPE)) {
            tab = getTab(current.tabId);

            if (tab == null) {
                console.log("error: tab " + current.tabId + " cannot be found");
            } else {
                createChildren(tab.url, detail.url);
            }
        } else {
            createRoot(detail.url);
        }   
    
        chrome.tabs.query({}, function(tabs) {
            tabStatus = tabs;
            updateCurrentNodeID(current.tabId);
        }); 
    }

});

function updateLabel (url, title) {
    url = urlHash(url);
    if (url in sites) {
        nodes[sites[url].index].label = title;
    }
}

chrome.webNavigation.onDOMContentLoaded.addListener(function (detail) {
    chrome.tabs.get(detail.tabId, function (tab) {
        if (tab != null) {
            updateLabel(tab.url, tab.title);
        }
    });
});


chrome.omnibox.onInputEntered.addListener(function (info) {
    chrome.tabs.update({
        url: GOOGLE_SEARCH_STR + info
    });
});

chrome.tabs.onActivated.addListener(function (info) {
    updateCurrentTabID(info.tabId);
    updateCurrentNodeID(info.tabId);
});

chrome.windows.onFocusChanged.addListener(function (id) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        tabId = tabs[0].id;
        updateCurrentTabID(tabId);
        updateCurrentNodeID(tabId);
    });

});
