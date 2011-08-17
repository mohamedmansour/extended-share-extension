/**
 * Injection Content Script.
 *
 * @author Mohamed Mansour 2011 (http://mohamedmansour.com)
 * @constructor
 */
Injection = function() {
  this.availableShares = [];
  this.originalTextNode = document.createTextNode(' \u00a0-\u00a0 ');

  this.originalShareNode = document.createElement('span');
  this.originalShareNode.setAttribute('role', 'button');
  this.originalShareNode.setAttribute('class', 'b-j external-share');
  this.originalShareNode.innerHTML = 'Share on ...';

  this.originalBubbleContainer = document.createElement('div');
  this.originalBubbleContainer.setAttribute('class', 'g-K');
  this.originalBubbleContainer.setAttribute('style', 'left: 172px; margin-top: 4px; opacity: 1; ');
  this.originalBubbleContainer.innerHTML =
      '<div class="g-K-m-e">' + 
      // Content.
      '  <div class="Fn" style="width: auto">' + 
      '    <div class="b-o-l" style="margin-bottom: 0px;"></div>' + 
      '  </div>' + 
      '</div>' + 
      // Close button.
      '<div class="g-K-sg-e g-K-sg" role="button" tabindex="0" style="padding: 5px"><div class="g-K-Fj"></div></div>' +
      // Arrow on top.
      '<div class="g-K-bc-e g-K-bc g-K-se" style="left: 20px; ">' + 
      '  <div class="g-K-Gc"></div>' + 
      '  <div class="g-K-Fc"></div>' + 
      '</div>' +
      '<div class="gp-crx-settings" style="cursor: pointer;position: absolute;right: 0;padding-right: 5px;font-size: 10px; color: #aaa" role="button" tabindex="0">options</div>';
};

Injection.STREAM_CONTAINER_ID = 'pr';
Injection.STREAM_ARTICLE_ID = '.ej.Bx';
Injection.STREAM_ACTION_BAR_ID = '.ll';
Injection.STREAM_AUTHOR_ID = '.hC a';
Injection.BUBBLE_CONTAINER_ID = 'g-K';
Injection.BUBBLE_SHARE_CONTENT_ID = '.b-o-l';
Injection.BUBBLE_CLOSE_ID = '.g-K-sg-e.g-K-sg';

/**
 * Initialize the events that will be listening within this DOM.
 */
Injection.prototype.init = function() {
  // Listen when the subtree is modified for new posts.
  var googlePlusContentPane = document.querySelector('.' + Injection.STREAM_CONTAINER_ID);
  if (googlePlusContentPane) {
    chrome.extension.sendRequest({method: 'GetSettings'}, this.onSettingsReceived.bind(this));
    googlePlusContentPane.addEventListener('DOMSubtreeModified',
                                           this.onGooglePlusContentModified.bind(this), false);
    chrome.extension.onRequest.addListener(this.onExternalRequest.bind(this));
  }
};

/**
 * This does an array comparison to see if two arrays are the same. This assumes the arrays are
 * already sorted.
 *
 * @param {Array<string>} a sorted array.
 * @param {Array<string>} b sorted array.
 * @return true if arrays are the same otherwise false.
 */
Injection.prototype.compareArrays = function(a, b) {
  if (a.length != b.length) {
    return false;
  }
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) { 
      return false;
    }
  }
  return true;
};

/**
 * Settings received, update content script.
 */
Injection.prototype.onSettingsReceived = function(response) { 
  // If only a single share is enabled, just rename all the links to that share name.
  if (!this.compareArrays(this.availableShares, response.data)) {
    var existingShares = document.querySelectorAll('.external-share');
    if (response.data.length == 1) {
      var shareName = Shares[response.data[0]].name;
      for (var i in existingShares) {
        existingShares[i].innerHTML = 'Share on ' + shareName;
      }
    }
    else {
      for (var i in existingShares) {
        existingShares[i].innerHTML = 'Share on ...';
      }
    }
  }

  this.availableShares = response.data;
};

/**
 * Figures out where the direct link URL is for the post within the |dom|.
 * This might change in the future since we are scraping it.
 *
 * @param {Object<HTMLElement>} dom The parent DOM source for the item.
 */
Injection.prototype.parseURL = function(dom) {
  var parent = dom.parentNode.parentNode.parentNode;
  var link = parent.querySelector('a[target="_blank"]');
  var text = '';
  var title = parent.querySelector(Injection.STREAM_AUTHOR_ID);
  if (title) {
    title = title.innerText + ' @ Google+';
  }
  if (link) {
    text = parent.querySelector(Injection.STREAM_ARTICLE_ID);
    if (text) {
      text = text.innerText;
    }
    else {
      text = ''; // Empty for now till we figure out what to do.
    }
    link = link.href;
    // Support multiple accounts.
    link = link.replace(/plus\.google\.com\/u\/(\d*)/, 'plus.google.com');
  }
  return {
    status: link ? true : false,
    link: link,
    text: text,
    title: title
  };
};

/**
 * Removes the bubble from the DOM. Same functionality as the share button.
 *
 * @param {Object<MouseEvent>} event The mouse event.
 */
Injection.prototype.destroyBubble = function(event) {
  var element = event.srcElement;
  while (element.className != Injection.BUBBLE_CONTAINER_ID) {
    element = element.parentNode;
  }
  element.parentNode.removeChild(element);
};

/**
 * Visits the options page.
 * 
 * @param {Object<MouseEvent>} event The mouse event.
 */
Injection.prototype.visitOptions = function(event) {
  this.destroyBubble(event);
  window.open(chrome.extension.getURL('options.html'));
};

/**
 * Computes the 
 *
 * @param {string} share The social share object defined in Shares array.
 * @param {string} result The URL detail request that contains the parsed data.
 */
Injection.prototype.createSocialLink = function(share, result) {
  var image = share.icon;
  var name = share.name;
  var url = share.url;
  var limit = share.trim;
  var text = limit ? result.text.substring(0, 100) : result.text;
  url = url.replace('\${link}', encodeURIComponent(result.link));
  url = url.replace('\${text}',  encodeURIComponent(text.trim()));
  url = url.replace('\${title}', encodeURIComponent(result.title));
  return url;
};

/**
 * Creates the social hyperlink image.
 *
 * @param {string} icon The image for the share name.
 * @param {string} name The social name 
 * @param {string} url The URL to share.
 */
Injection.prototype.createSocialIcon = function(icon, name, url) {
  var a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('style', 'margin: 0 .4em');
  a.onclick = this.destroyBubble.bind(this);

  var img = document.createElement('img');
  img.setAttribute('src', chrome.extension.getURL(icon));
  img.setAttribute('title', 'Share on ' + name);
  img.setAttribute('style', 'vertical-align: middle');

  a.appendChild(img);
  return a;
};

/**
 * Creates the bubble overlay. Uses same CSS used in 
 *
 * @param {number} x The mouse x position.
 * @param {number} y The mouse y position.
 * @param {Object<HTMLElement>} src The parent DOM source for the item.
 */
Injection.prototype.createBubble = function(src, event) {
  var bubbleContainer = this.originalBubbleContainer.cloneNode(true);
  var nodeToFill = bubbleContainer.querySelector(Injection.BUBBLE_SHARE_CONTENT_ID);

  var result = this.parseURL(src);
  if (result.status) {
    if (this.availableShares.length > 1) { // User has some shares, display them.
      for (var i in this.availableShares) {
        var share = Shares[this.availableShares[i]];
        var url = this.createSocialLink(share, result);
        nodeToFill.appendChild(this.createSocialIcon(share.icon, share.name, url));
      }
    }
    else if (this.availableShares.length == 1) { // Single share, auto link it directly.
      var url = this.createSocialLink(Shares[this.availableShares[0]], result);
      window.open(url);
      return; // TODO(mohamed): Figure out a better way.
    }
    else { // Nothing setup.
      nodeToFill.appendChild(document.createTextNode('No share links enabled, visit options to add a couple!'));
    }
  }
  else {
    nodeToFill.appendChild(document.createTextNode('Cannot find URL, please file bug to developer. hello@mohamedmansour.com'));
  }

  var closeCross = bubbleContainer.querySelector(Injection.BUBBLE_CLOSE_ID);
  closeCross.onclick = this.destroyBubble.bind(this);

  var settingsButton = bubbleContainer.querySelector('.gp-crx-settings');
  settingsButton.onclick = this.visitOptions.bind(this);
  
  src.parentNode.appendChild(bubbleContainer);
};

/**
 * On Click event for when sending the link.
 *
 * @param {Object<MouseEvent>} event The mouse event.
 */
Injection.prototype.onSendClick = function(event) {
  var element = event.srcElement.parentNode.querySelector('.' + Injection.BUBBLE_CONTAINER_ID);
  if (!element) {
    this.createBubble(event.srcElement, event);
  }
  else {
    element.style.display = 'block';
  }
};

/**
 * Render all the items in the current page.
 */
Injection.prototype.resetAndRenderAll = function() {
  var googlePlusContentPane = document.querySelector('.'  + Injection.STREAM_CONTAINER_ID);
  if (googlePlusContentPane) {
    googlePlusContentPane.removeEventListener('DOMSubtreeModified',
                                              this.onGooglePlusContentModified.bind(this), false);
    googlePlusContentPane.addEventListener('DOMSubtreeModified',
                                           this.onGooglePlusContentModified.bind(this), false);
  }
  var actionBars = document.querySelectorAll(Injection.STREAM_ACTION_BAR_ID);
  for (var i = 0; i < actionBars.length; i++) {
    this.renderItem(actionBars[i]);
  }
};

/**
 * Render the "Share on ..." Link on each post.
 *
 * @param {Object<ModifiedDOM>} event modified event.
 */
Injection.prototype.renderItem = function(itemDOM) {
  if (itemDOM && !itemDOM.classList.contains('gpi-crx')) {
    var shareNode = this.originalShareNode.cloneNode(true);
    if (this.availableShares.length == 1) {
      shareNode.innerHTML = 'Share on ' + Shares[this.availableShares[0]].name;
    }
    shareNode.onclick = this.onSendClick.bind(this);
    itemDOM.appendChild(this.originalTextNode.cloneNode(true));
    itemDOM.appendChild(shareNode);
    itemDOM.classList.add('gpi-crx');
  }
};

/**
 * Render the "Share on ..." Link on each post.
 */
Injection.prototype.onGooglePlusContentModified = function(e) {
  if (e.target.nodeType == Node.ELEMENT_NODE && e.target.id.indexOf('update') == 0) {
    var actionBar = document.querySelector(Injection.STREAM_ACTION_BAR_ID);
    this.renderItem(actionBar);
  }
};

/**
 * API to handle when clicking on different HTML5 push API. This somehow doesn't
 * play well with DOMSubtreeModified
 */
Injection.prototype.onExternalRequest = function(request, sender, sendResponse) {
  if (request.method == 'RenderShares' || request.method == 'InitialInjection') {
    this.resetAndRenderAll();
  }
  else if (request.method == 'SettingsUpdated') {
    this.onSettingsReceived(request);
  }
  sendResponse({});
};

// Main
var injection = new Injection();
injection.init();