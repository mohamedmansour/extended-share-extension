/**
 * Injection Content Script.
 *
 * @author Mohamed Mansour 2011 (http://mohamedmansour.com)
 * @constructor
 */
Injection = function() {
  this.auto_close_shelf = false;
  this.share_limited = false;
  this.use_link = true;
  this.availableShares = [];
  this.closeIcon = this.createCloseIcon();
  this.settingsIcon = this.createSettingsIcon();
  this.currentlyOpenedShelf = null;
  this.windowPressedListener = this.onWindowPressed.bind(this);
};

Injection.CONTENT_PANE_ID = '#contentPane';
Injection.SHARE_BUTTON_SELECTOR = 'div[role="button"]:nth-of-type(2)';
Injection.STREAM_UPDATE_SELECTOR = 'div[id^="update"]';
Injection.STREAM_POST_LINK = 'a[target="_blank"]';
Injection.STREAM_CONTENTS_SELECTOR = 'div > div > div:nth-of-type(3)';
Injection.STREAM_CONTENTS_MAIN_SELECTOR = Injection.STREAM_CONTENTS_SELECTOR + ' > div:nth-of-type(1)';
Injection.STREAM_CONTENTS_EMBED_SELECTOR = Injection.STREAM_CONTENTS_SELECTOR + ' > div:last-of-type';
Injection.STREAM_SHARING_DETAILS = 'header > span > span:last-of-type';
Injection.STREAM_ACTION_BAR_SELECTOR = Injection.STREAM_UPDATE_SELECTOR + '> div > div:nth-of-type(1) > div:last-child';
Injection.STREAM_AUTHOR_SELECTOR = 'header > h3';
Injection.STREAM_IMAGE_SELECTOR = 'img:not([oid])';
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
  if (a.length !== b.length) {
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
 * Prepares the share data by prefetching the icon and display name.
 *
 * @param {data} List of shares we are modifying.
 */
Injection.prototype.prepareShareData = function(data) {
  var shareName = 'Share on ';
  var shareIcon = null;
  var shareHeight = null;
  var shareTop = null;
  var shareWidth = null;
  var shareZoom = null;
  var shareMarginLeft = null;
  if (data.length === 1) {
    var shareItem = Shares[data[0]];
    shareName += shareItem.name;
    shareIcon = chrome.extension.getURL(shareItem.icon);
    shareTop = '-3px';
    shareHeight = '32px';
    shareWidth = '32px';
    shareZoom = 0.6;
    shareMarginLeft = '7px';
  }
  else {
    shareName += '...';
    shareIcon = chrome.extension.getURL('/img/share.png');
    shareTop = '2px';
    shareHeight = '14px';
    shareWidth = '10px';
    shareZoom = 1;
    shareMarginLeft = '0px';
  }
  return {
    name: shareName,
    icon: shareIcon,
    top: shareTop,
    height: shareHeight,
    width: shareWidth,
    zoom: shareZoom,
    marginLeft: shareMarginLeft
  }
};

/**
 * Decorates the exisiting share based on a specific state.
 *
 * @param {Element} shareNode the share to decorate.
 * @param {Object} shareData the properties for the decoration.
 */
Injection.prototype.decorateShare = function(shareNode, shareData) {
  shareNode.setAttribute('data-tooltip', shareData.name);
  shareNode.style.marginLeft = shareData.marginLeft;
  shareNode.style.width = shareData.width;
  var shareIcon = shareNode.childNodes[0];
  shareIcon.style.background = 'no-repeat url(' + shareData.icon + ')';
  shareIcon.style.top = shareData.top;
  shareIcon.style.height = shareData.height;
  shareIcon.style.zoom = shareData.zoom;
  shareIcon.style.width = shareData.width;
};

/**
 * Settings received, update content script.
 */
Injection.prototype.onSettingsReceived = function(response) {
  this.auto_close_shelf = response.data.auto_close_shelf;
  this.share_limited = response.data.share_limited;
  this.use_link = response.data.use_link;
  var shares = response.data.shares;
  
  // If only a single share is enabled, just rename all the links to that share name.
  if (!this.compareArrays(this.availableShares, shares)) {
    // Destroy all the shares since it is easier for it to re-render it.
    this.destroyShelf();
    
    // Query all the existing shares on the page.
    var existingShares = document.querySelectorAll('.external-share');

    var shareData = this.prepareShareData(shares);
    for (var s = 0; s < existingShares.length; s++) {
      var existingShare = existingShares[s];
      this.decorateShare(existingShare, shareData);
    }
  }
  this.availableShares = shares;
};

/**
 * Figures out where the direct link URL is for the post within the |dom|.
 * This might change in the future since we are scraping it.
 *
 * @param {Object<HTMLElement>} dom The parent DOM source for the item.
 */
Injection.prototype.parseURL = function(parent) {
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
    link = link.href.replace(/plus\.google\.com\/u\/(\d*)/, 'plus.google.com');
    var textDOM = null;
    var postContent = parent.querySelector(Injection.STREAM_CONTENTS_MAIN_SELECTOR);
    var postEmbed = parent.querySelector(Injection.STREAM_CONTENTS_EMBED_SELECTOR);
    if (postContent.innerText.trim()) {
      textDOM = postContent;
    }
    else {
      textDOM = postEmbed;
    }

    if (textDOM) {
      text = textDOM.innerText.trim().substring(0, 800);

      // Use link instead of post link. We put preference in links for the embedding
      // content if exists.
      if (this.use_link) {
        var linkDOM = (postEmbed && postEmbed.querySelector('a')) || textDOM.querySelector('a');
        if (linkDOM) {
          link = linkDOM.href;
        }
      }
    }
    else {
      text = ''; // Empty for now till we figure out what to do.
    }
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
Injection.prototype.destroyShelf = function(event) {
  if (!this.currentlyOpenedShelf) {
    return;
  }
  this.currentlyOpenedShelf.style.height = '1px';
  setTimeout(function() {
    this.currentlyOpenedShelf.parentNode.removeChild(this.currentlyOpenedShelf);
    this.currentlyOpenedShelf = null;
    window.removeEventListener('keyup', this.windowPressedListener, false);
  }.bind(this), 300);
};

/**
 * Visits the options page.
 * 
 * @param {Object<MouseEvent>} event The mouse event.
 */
Injection.prototype.visitOptions = function(event) {
  if (this.auto_close_shelf) {
    this.destroyShelf();
  }
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
 * Creates the DOM for the close button.
 */
Injection.prototype.createCloseIcon = function() {
  var closeIcon = document.createElement('div');
  closeIcon.setAttribute('class', 'gp-crx-close');
  return closeIcon;
};

/**
 * Creates the DOM for the settings button.
 */
Injection.prototype.createSettingsIcon = function() {
  var settingsButton = document.createElement('span');
  settingsButton.setAttribute('class', 'gp-crx-settings');
  settingsButton.innerText = 'options';
  return settingsButton;
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
  a.setAttribute('href', '#');
  a.setAttribute('style', 'margin: 0 .4em');
  a.onclick = function(e) {
    e.preventDefault();
    chrome.extension.sendRequest({method: 'OpenURL', data: url});
    if (this.auto_close_shelf) {
      this.destroyShelf();
    }
    return false;
  }.bind(this);

  var img = document.createElement('img');
  img.setAttribute('src', chrome.extension.getURL(icon));
  img.setAttribute('data-tooltip', 'Share on ' + name);
  img.setAttribute('style', 'vertical-align: middle');

  a.appendChild(img);
  return a;
};

/**
 * Creates the DOM for the shelf.
 */
Injection.prototype.createShelf = function(itemDOM) {
  // Only allow a singleton instance of the bubble opened at all times.
  if (this.currentlyOpenedShelf) {
    this.destroyShelf();
    return;
  }
  
  var nodeToFill = document.createElement('div');
  nodeToFill.setAttribute('class', 'gp-crx-shelf');
  
  var result = this.parseURL(itemDOM);
  if (!result.isPublic && !this.share_limited) {
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
    else if (this.availableShares.length === 1) { // Single share, auto link it directly.
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

  // Add the shelf node to the existing DOM.
  itemDOM.parentNode.insertBefore(nodeToFill, itemDOM.nextSibling);

  // Add close icon.
  var closeIcon = this.closeIcon.cloneNode(true);
  closeIcon.onclick = this.destroyShelf.bind(this);
  nodeToFill.appendChild(closeIcon);

  // Add settings button.
  var settingsIcon = this.settingsIcon.cloneNode(true);
  settingsIcon.onclick = this.visitOptions.bind(this);
  nodeToFill.appendChild(settingsIcon);
  
  // Close the share bubble when the user hits escape.
  window.addEventListener('keyup', this.windowPressedListener, false);

  // Save the current shelf so we can refer back to it later on.
  this.currentlyOpenedShelf = nodeToFill;

  // Animate it by fading in.
  setTimeout(function() {
    this.currentlyOpenedShelf.style.height = '32px';
  }.bind(this));
};

/**
 * Listens on key presses while the share bubble is active.
 */
Injection.prototype.onWindowPressed = function(e) {
  if (e.keyCode  === 27) { // ESCAPE.
    this.destroyShelf();
  }
};

/**
 * On Click event for when sending the link.
 *
 * @param {Object<MouseEvent>} event The mouse event.
 */
Injection.prototype.onSendClick = function(event) {
  // discover update parent.
  var cardDOM = event.srcElement;
  while (cardDOM.id.indexOf('update-') !== 0) {
    cardDOM = cardDOM.parentNode;
  }
  
  var mainContentCardDOM = cardDOM.childNodes[0].childNodes[0];
  if (mainContentCardDOM) {
    this.createShelf(mainContentCardDOM);
  }
};

/**
 * Render the "Share on ..." Link on each post.
 *
 * @param {Object<ModifiedDOM>} event modified event.
 */
Injection.prototype.renderItem = function(itemDOM) {
  if (itemDOM && !itemDOM.classList.contains('gpi-crx')) {
    var originalShareNode = itemDOM.querySelector(Injection.SHARE_BUTTON_SELECTOR);
    // This means you cannot share this post, because it is locked.
    if (!originalShareNode) {
      return;
    }
    var shareNode = originalShareNode.cloneNode(true);

    // Remove the last class (I believe that is the trigger class from inspector).
    var lastClassNameItem = originalShareNode.classList[2];
    shareNode.classList.remove(lastClassNameItem);
    shareNode.classList.add('external-share');

    var shareData = this.prepareShareData(this.availableShares);
    shareNode.setAttribute('aria-label', shareData.name);
    this.decorateShare(shareNode, shareData);
    shareNode.onclick = this.onSendClick.bind(this);

    originalShareNode.parentNode.insertBefore(shareNode, originalShareNode.nextSibling );
    itemDOM.classList.add('gpi-crx');
  }
};

// TODO: Everything under here should be converted to a Mutation event instead.
////////////////////////////////////////////////////////////////////////////////

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
 */
Injection.prototype.onGooglePlusContentModified = function(e) {
  // This happens when a new stream is selected
  if (e.relatedNode && e.relatedNode.parentNode && e.relatedNode.parentNode.id === 'contentPane') {
    // We're only interested in the insertion of entire content pane
    this.renderAllItems(e.target);
  } else if (e.target.nodeType === Node.ELEMENT_NODE && e.target.id.indexOf('update') === 0) {
    var actionBar = e.target.querySelector(Injection.STREAM_ACTION_BAR_SELECTOR);
    this.renderItem(actionBar);
  }
};

/**
 * Render on all the items of the documents, or within the specified subtree
 * if applicable
 */
Injection.prototype.renderAllItems = function(subtreeDOM) {
  var actionBars = typeof subtreeDOM === 'undefined' ?
    document.querySelectorAll(Injection.STREAM_ACTION_BAR_SELECTOR) : subtreeDOM.querySelectorAll(Injection.STREAM_ACTION_BAR_SELECTOR);
  for (var i = 0; i < actionBars.length; i++) {
    this.renderItem(actionBars[i]);
  }
};

/**
 * API to handle when clicking on different HTML5 push API. This somehow doesn't
 * play well with DOMSubtreeModified
 */
Injection.prototype.onExternalRequest = function(request, sender, sendResponse) {
  if (request.method === 'RenderShares' || request.method === 'InitialInjection') {
    this.resetAndRenderAll();
  }
  else if (request.method === 'SettingsUpdated') {
    this.onSettingsReceived(request);
  }
  sendResponse({});
};

// Main
var injection = new Injection();
injection.init();
