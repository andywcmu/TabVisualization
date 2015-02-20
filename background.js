var counter = 0;

/* url: {title, nodeIndex} */
var sites = {};

var nodes = [];
var labelAnchors = [];
var labelAnchorLinks = [];
var links = [];


/* tabID: nodeIndex */
activeTab = {};

current = {'tabId': -1, 'windowId': -1, 'url': null};

function urlHash (url) {
    return url;
}

chrome.webNavigation.onCommitted.addListener(function (detail) {

    // console.log(detail.transitionType);

    if (detail.transitionType != "auto_subframe") {
        newUrl = urlHash(detail.url);


        if (newUrl in sites) {
            /* increase weight? */
        } else {
            var node = {
                label : newUrl
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
            
            sites[newUrl] = {title : newUrl,
                             index : nodes.length - 1};
        }

        if (detail.transitionType != 'auto_subframe') {
            if (detail.transitionType == 'link') {
                
                

                console.log("link from " + current.url + " to " + newUrl);
                console.log("id " + sites[current.url].index + " -> " + sites[newUrl].index);

                links.push({
                    source : sites[current.url].index,
                    target : sites[newUrl].index,
                    weight : 1
                });

                // newTabId = detail.tabId;
                // console.log('LINK from tab ' + current.tabId + ' to ' + newTabId);

            }
        }

        current.url = newUrl;
    }
    
});

chrome.webNavigation.onDOMContentLoaded.addListener(function (detail) {
    chrome.tabs.get(detail.tabId, function (tab) {
        /* update title of a tab */
        url = urlHash(tab.url);
        if (url in sites) {
            nodes[sites[url].index].label = tab.title;
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
    current.tabId = info.tabId;
    current.windowId = info.windowId;
    chrome.tabs.get(info.tabId, function (tab) {
        current.url = urlHash(tab.url);
    });
});

chrome.windows.onFocusChanged.addListener(function (id) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        current.tabId = tabs[0].id;
        current.windowId = tabs[0].windowId;
        chrome.tabs.get(tabs[0].id, function (tab) {
            current.url = urlHash(tab.url);
        });
    });

    
});
