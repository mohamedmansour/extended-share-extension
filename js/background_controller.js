/**
 * Manages a single instance of the entire application.
 *
 * @author Mohamed Mansour 2011 (http://mohamedmansour.com)
 * @constructor
 */
BackgroundController = function() {
  this.onExtensionLoaded();
};

/**
 * Triggered when the extension just loaded. Should be the first thing
 * that happens when chrome loads the extension.
 */
BackgroundController.prototype.onExtensionLoaded = function() {
  var currVersion = chrome.app.getDetails().version;
  var prevVersion = settings.version;
  if (currVersion != prevVersion) {
    // Check if we just installed this extension.
    if (typeof prevVersion == 'undefined') {
      this.onInstall();
    } else {
      this.onUpdate(prevVersion, currVersion);
    }
    settings.version = currVersion;
  }
};

/**
 * Triggered when the extension just installed.
 */
BackgroundController.prototype.onInstall = function() {
  this.doWorkTabs(function(tab) {
    chrome.tabs.executeScript(tab.id, { file: 'js/extended_shares.js',
                              allFrames: true }, function() {
      chrome.tabs.executeScript(tab.id, { file: 'js/extended_injection.js',
                                allFrames: true }, function() {
        // This is needed because all the DOM is already inserted, no events
        // would have been fired. This will force the events to fire after
        // initial injection.
        chrome.tabs.sendRequest(tab.id, {
            method: 'InitialInjection'
        });
      });
    });
  });
  chrome.tabs.create({url: 'options.html'});
};

/**
 * Do some work on all tabs that are on Google Plus.
 *
 * @param {Function<Tab>} callback The callback with the tab results.
 */
BackgroundController.prototype.doWorkTabs = function(callback) {
  self = this;
  chrome.windows.getAll({ populate: true }, function(windows) {
    for (var w = 0; w < windows.length; w++) {
      var tabs = windows[w].tabs;
      for (var t = 0; t < tabs.length; t++) {
        var tab = tabs[t];
        if (self.isValidURL(tab.url)) { 
          callback(tab);
        }
      }
    }
  });
};

/**
 * Inform all Content Scripts that new settings are available.
 */
BackgroundController.prototype.updateSettings = function() {
  self = this;
  this.doWorkTabs(function(tab) {
    chrome.tabs.sendRequest(tab.id, {
        method: 'SettingsUpdated',
        data: settings
    });
  });
};

/**
 * Check if the URL is part of plus websites.
 
 * @param {string} url The URL to check if valid.
 */
BackgroundController.prototype.isValidURL = function(url) {
  return (url.indexOf('https://plus.google.com') == 0 ||
          url.indexOf('http://plus.google.com') == 0);
};

/**
 * Triggered when the extension just uploaded to a new version. DB Migrations
 * notifications, etc should go here.
 *
 * @param {string} previous The previous version.
 * @param {string} current  The new version updating to.
 */
BackgroundController.prototype.onUpdate = function(previous, current) {
  if (!settings.opt_out) {
    chrome.tabs.create({url: 'options.html#updated'});
  }
};

/**
 * Initialize the main Background Controller
 */
BackgroundController.prototype.init = function() {
  // Listens on new tab updates. Google+ uses new sophisticated HTML5 history
  // push API, so content scripts don't get recognized always. We inject
  // the content script once, and listen for URL changes.
  chrome.tabs.onUpdated.addListener(this.tabUpdated.bind(this));
  chrome.extension.onRequest.addListener(this.onExternalRequest.bind(this));
};

/**
 * Listens on new tab URL updates. We use this make sure we capture history
 * push API for asynchronous page reloads.
 *
 * @param {number} tabId Tab identifier that changed.
 * @param {object} changeInfo lists the changes of the states.
 * @param {object<Tab>} tab The state of the tab that was updated.
 */
BackgroundController.prototype.tabUpdated = function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    chrome.tabs.sendRequest(tabId, { method: 'RenderShares' });
  }
};

/**
 * Listen on requests coming from content scripts.
 *
 * @param {object} request The request object to match data.
 * @param {object} sender The sender object to know what the source it.
 * @param {Function} sendResponse The response callback.
 */
BackgroundController.prototype.onExternalRequest = function(request, sender, sendResponse) {
  if (request.method == 'GetSettings') {
    sendResponse({
        data: settings
    });
  }
  else if (request.method == 'OpenURL') {
    if (settings.open_as_popup) {
      chrome.windows.create({url: request.data, type: 'popup', width: 700, height: 400});
    }
    else {
      chrome.tabs.create({url: request.data});
    }
    sendResponse({});
  }
  else {
    sendResponse({});
  }
};
