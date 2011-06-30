/**
 * Manages a single instance of the entire application.
 * @constructor
 */
BackgroundController = function()
{
};

/**
 * Initialize the main Background Controller
 */
BackgroundController.prototype.init = function()
{
  // Listens on new tab updates. Google+ uses new sophisticated HTML5 history
  // push API, so content scripts don't get recognized always. We inject
  // the content script once, and listen for URL changes.
  chrome.tabs.onUpdated.addListener(this.tabUpdated.bind(this));
};

/**
 * Listens on new tab URL updates. We use this make sure we capture history
 * push API for asynchronous page reloads.
 *
 * @param {number} tabId Tab identifier that changed.
 * @param {object} changeInfo lists the changes of the states.
 * @param {object<Tab>} tab The state of the tab that was updated.
 */
BackgroundController.prototype.tabUpdated = function(tabId, changeInfo, tab)
{
  if (changeInfo.status == 'complete') {
    chrome.tabs.sendRequest(tabId, { method: 'render' });
  }
};