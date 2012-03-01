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
  this.originalShareNode.setAttribute('class', 'external-share');
  this.originalShareNode.innerHTML = 'Share on ...';

  this.originalBubbleContainer = document.createElement('div');
  this.originalBubbleContainer.setAttribute('class', 'gp-crx-bubble');
  this.originalBubbleContainer.innerHTML =
      '<div class="gp-crx-content">' + 
      // Content.
      '  <div class="gp-crx-wrapper">' + 
      '    <div class="gp-crx-shares"></div>' + 
      '  </div>' + 
      '</div>' + 
      // Close button.
      '<div class="gp-crx-close" role="button" tabindex="0">' +
      '  <div></div>' +
      '</div>' +
      // Arrow on top.
      '<div class="gp-crx-arrow">' + 
      '  <div class="gp-crx-arrow-left"></div>' + 
      '  <div class="gp-crx-arrow-right"></div>' + 
      '</div>' +
      '<div class="gp-crx-settings" role="button" tabindex="0">options</div>';
  this.currentlyOpenedBubble = null;
  this.windowPressedListener = this.onWindowPressed.bind(this);
};

Injection.CONTENT_PANE_ID = '#contentPane';
Injection.STREAM_ARTICLE_ID = 'div:nth-of-type(2) > div:first-child';
Injection.STREAM_UPDATE_SELECTOR = 'div[id^="update"]';
Injection.STREAM_POST_LINK = 'a[target="_blank"]';
Injection.STREAM_SHARING_DETAILS = 'span[title="Sharing details"]';
Injection.STREAM_ACTION_BAR_SELECTOR = Injection.STREAM_UPDATE_SELECTOR + ' > div > div:nth-of-type(3)';
Injection.STREAM_AUTHOR_SELECTOR = 'div > div > h3 > span';
Injection.STREAM_IMAGE_SELECTOR = Injection.STREAM_UPDATE_SELECTOR + ' > div div[data-content-type] > img';
Injection.BUBBLE_CONTAINER_ID = 'gp-crx-bubble';
Injection.BUBBLE_SHARE_CONTENT_ID = '.gp-crx-shares';
Injection.BUBBLE_CLOSE_ID = '.gp-crx-close';

/**
 * Initialize the events that will be listening within this DOM.
 */
Injection.prototype.init = function() {
  // Listen when the subtree is modified for new posts.
  var googlePlusContentPane = document.querySelector(Injection.CONTENT_PANE_ID);
  if (googlePlusContentPane) {
    chrome.extension.sendRequest({method: 'GetSettings'}, this.onSettingsReceived.bind(this));
    googlePlusContentPane.addEventListener('DOMNodeInserted',
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
  var link = parent.querySelector(Injection.STREAM_POST_LINK);
  var image = parent.querySelector(Injection.STREAM_IMAGE_SELECTOR);
  var title = parent.querySelector(Injection.STREAM_AUTHOR_SELECTOR);
  var sharingDetails = parent.querySelector(Injection.STREAM_SHARING_DETAILS);

  var isPublic = sharingDetails.innerText === 'Public';
  var text = '';
  
  if (title) {
    title = title.innerText + ' @ Google+';
  }

  if (image) {
    image = image.src;
  }
  
  if (link) {
    // Smartly find out the contents of that div.
    var postContent = dom.parentNode.previousSibling.cloneNode(true);
    var tmp = postContent.querySelectorAll('span[class]');
    if (tmp && tmp.length) {
        var editLink = tmp[tmp.length - 1];
        editLink.parentNode.removeChild(editLink);
    }
    if (postContent.innerText.replace(/\s+/g, '')) {
      // prevent huge querystring
      // addthis trims automatically to fit on twitter
      text = postContent.innerText.substring(0, 800);
    }
    else {
      text = parent.querySelector(Injection.STREAM_ARTICLE_ID);
      if (text) {
        text = text.innerText;
      }
      else {
        text = ''; // Empty for now till we figure out what to do.
      }
    }
    link = link.href;
    // Support multiple accounts.
    link = link.replace(/plus\.google\.com\/u\/(\d*)/, 'plus.google.com');
  }

  return {
    status: link ? true : false,
    link: link,
    text: text,
    title: title,
    media: image,
    isPublic: isPublic
  };
};

/**
 * Removes the bubble from the DOM. Same functionality as the share button.
 *
 * @param {Object<MouseEvent>} event The mouse event.
 */
Injection.prototype.destroyBubble = function(event) {
  this.currentlyOpenedBubble.parentNode.removeChild(this.currentlyOpenedBubble);
  this.currentlyOpenedBubble = null;
  window.removeEventListener('keyup', this.windowPressedListener, false);
};

/**
 * Visits the options page.
 * 
 * @param {Object<MouseEvent>} event The mouse event.
 */
Injection.prototype.visitOptions = function(event) {
  this.destroyBubble();
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
  if (share.media) {
    url = url.replace('\${media}', encodeURIComponent(result.media));
  }
  url = url.replace('\${link}', encodeURIComponent(result.link));
  url = url.replace('\${text}',  encodeURIComponent(text.trim()));
  url = url.replace('\${title}', encodeURIComponent(result.title));
  return url;
};

/**
 * Social Icon share clicked.
 */
Injection.prototype.onSocialIconClicked = function(e) {
  chrome.extension.sendRequest({method: 'OpenURL', data: e.target.href});
  this.destroyBubble();
  return false;
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
  a.onclick = this.onSocialIconClicked.bind(this);

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
  // Only allow a singleton instance of the bubble opened at all times.
  if (this.currentlyOpenedBubble) {
    this.destroyBubble();
  }

  var bubbleContainer = this.originalBubbleContainer.cloneNode(true);
  var nodeToFill = bubbleContainer.querySelector(Injection.BUBBLE_SHARE_CONTENT_ID);

  var result = this.parseURL(src);
  if (!result.isPublic) {
    nodeToFill.appendChild(document.createTextNode('You cannot share this post because it is not public.'));
  }
  else if (result.status) {
    if (this.availableShares.length > 1) { // User has some shares, display them.
      for (var i in this.availableShares) {
        var share = Shares[this.availableShares[i]];
        if (!share.media || result.media) {
          var url = this.createSocialLink(share, result);
          nodeToFill.appendChild(this.createSocialIcon(share.icon, share.name, url));
        }
      }
    }
    else if (this.availableShares.length == 1) { // Single share, auto link it directly.
      var url = this.createSocialLink(Shares[this.availableShares[0]], result);
      // Pass the URL to the background page so we can open it. This is needed
      // to overcome the block that Google+ is putting to redirect links.
      chrome.extension.sendRequest({method: 'OpenURL', data: url});
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
  
  // Setup the mouse listeners.
  bubbleContainer.style.left = event.target.offsetLeft + 'px';
  
  // Show the share bubble.
  src.parentNode.appendChild(bubbleContainer);

  // Save the current state so we can ensure only a single bubble could live.
  this.currentlyOpenedBubble = bubbleContainer;

  // Close the share bubble when the user hits escape.
  window.addEventListener('keyup', this.windowPressedListener, false);

  // Animate it by fading in.
  setTimeout(function() {
    this.currentlyOpenedBubble.style.opacity = 1.0;
  }.bind(this));
};

/**
 * Listens on key presses while the share bubble is active.
 */
Injection.prototype.onWindowPressed = function(e) {
  if (e.keyCode  == 27) { // ESCAPE.
    this.destroyBubble();
  }
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
  var googlePlusContentPane = document.querySelector(Injection.CONTENT_PANE_ID);
  if (googlePlusContentPane) {
    googlePlusContentPane.removeEventListener('DOMNodeInserted',
                                              this.onGooglePlusContentModified.bind(this), false);
    googlePlusContentPane.addEventListener('DOMNodeInserted',
                                           this.onGooglePlusContentModified.bind(this), false);
  }
  this.renderAllItems();
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
  // This happens when a new stream is selected
  if (e.relatedNode && e.relatedNode.parentNode && e.relatedNode.parentNode.id == 'contentPane') {
    // We're only interested in the insertion of entire content pane
    this.renderAllItems(e.target);
  } else if (e.target.nodeType == Node.ELEMENT_NODE && e.target.id.indexOf('update') == 0) {
    var actionBar = e.target.querySelector(Injection.STREAM_ACTION_BAR_SELECTOR);
    this.renderItem(actionBar);
  }
};

/**
 * Render on all the items of the documents, or within the specified subtree
 * if applicable
 */
Injection.prototype.renderAllItems = function(subtreeDOM) {
  var actionBars = typeof subtreeDOM == 'undefined' ?
    document.querySelectorAll(Injection.STREAM_ACTION_BAR_SELECTOR) : subtreeDOM.querySelectorAll(Injection.STREAM_ACTION_BAR_SELECTOR);
  for (var i = 0; i < actionBars.length; i++) {
    this.renderItem(actionBars[i]);
  }
}

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
