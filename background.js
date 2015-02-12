var counter = 0;

/* url: {title, nodeIndex} */
var sites = {};

var nodes = [];
var labelAnchors = [];
var labelAnchorLinks = [];
var links = [];


/* tabID: nodeIndex */
activeTab = {};

current = {'tabId': -1, 'windowId': -1, 'title': ''};

chrome.webNavigation.onCommitted.addListener(function (detail) {
    // console.log(detail);
    if (detail.transitionType != 'auto_subframe') {
        if (detail.transitionType == 'link') {

            /* add a node and path if necessary */
            if (detail.url in sites) {
                /* increase weight? */
            } else {
                var node = {
                    label : detail.url
                };
                nodes.push(node);
                labelAnchors.push({
                    node : node
                });
                labelAnchors.push({
                    node : node
                });
                labelAnchorLinks.push({
                    source : (nodes.length - 1) * 2,
                    target : (nodes.length - 1) * 2 + 1,
                    weight : 1
                });
                
                sites[detail.url] = {title : detail.url,
                                     index : nodes.length - 1};
            }

            // newTabId = detail.tabId;
            // console.log('LINK from tab ' + current.tabId + ' to ' + newTabId);

        }
    } 
});

chrome.webNavigation.onDOMContentLoaded.addListener(function (detail) {
    chrome.tabs.get(detail.tabId, function (tab) {
        /* update title of a tab */
        if (tab.url in sites) {
            nodes[sites[tab.url].index].label = tab.title;
        }
    });
});

// chrome.windows.onCreated.addListener(function (wd) {
//     console.log(wd);
// });

// chrome.webNavigation.onBeforeNavigate.addListener(function (details) {
//     chrome.tabs.query({}, function (tabs) {
//         console.log(tabs);
//     });
// });

chrome.tabs.onActivated.addListener(function (info) {
    
    console.log(info);
    current.tabId = info.tabId;
    current.windowId = info.windowId;
    // current.title = info
    // console.log(current);
});

chrome.windows.onFocusChanged.addListener(function (id) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        current.tabId = tabs[0].id;
        current.windowId = tabs[0].windowId;
        // console.log(current);
    });
});
