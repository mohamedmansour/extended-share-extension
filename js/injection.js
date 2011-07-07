// Shared DOM.
var originalTextNode = document.createTextNode(' \u00a0-\u00a0 ');
var originalShareNode = document.createElement('span');
originalShareNode.setAttribute('role', 'button');
originalShareNode.setAttribute('class', 'd-h external-share');
originalShareNode.innerHTML = 'Share on...';

var originalBubbleContainer = document.createElement('div');
originalBubbleContainer.setAttribute('class', 'tk3N6e-Ca');
originalBubbleContainer.setAttribute('style', 'left: 172px; margin-top: 4px');
originalBubbleContainer.innerHTML =
    // content
    '<div class="tk3N6e-Ca-p-b">'+
        '<div class="lgPbs" style="margin-right: 1em; margin-bottom: 0px;">Share on...</div>'+
    '</div>'+
    // cross to close
    '<div class="tk3N6e-Ca-kmh2Gb-b tk3N6e-Ca-kmh2Gb" role="button" tabindex="0"><div class="tk3N6e-Ca-uqvIpc"></div></div>'+
    // arrow on top
    '<div class="tk3N6e-Ca-kc-b tk3N6e-Ca-kc tk3N6e-Ca-Hi" style="left: 20px; "><div class="tk3N6e-Ca-jQ8oHc"></div><div class="tk3N6e-Ca-ez0xG"></div></div>';

/**
 * Figures out where the direct link URL is for the post within the |dom|.
 * This might change in the future since we are scraping it.
 *
 * @param {Object<HTMLElement>} dom The parent DOM source for the item.
 */
function parseURL(dom) {
  var parent = dom.parentNode.parentNode.parentNode;
  var link = parent.querySelector('a[target="_blank"]');
  var text = '';
  var title = '';
  if (link) {
    text = parent.querySelector('.a-b-f-i-p-R');
    if (text) {
      text = encodeURIComponent(text.textContent.substring(0, 100));
    }
    link = link.href;
    // Support multiple accounts.
    link = link.replace(/plus\.google\.com\/u\/(\d*)/, 'plus.google.com');
  }
  return {
    status: link ? true : false,
    url: link,
    text: text,
    title: title
  };
}

/**
 * Removes the bubble from the DOM. Same functionality as the share button.
 *
 * @param {Object<MouseEvent>} event The mouse event.
 */
function destroyBubble(event) {
  var element = event.srcElement.parentNode.parentNode;
  if (element && element.className != 'tk3N6e-Ca') {
    element = element.parentNode.parentNode;
  }
  element.parentNode.removeChild(element);
}

/**
 * Creates the social hyperlink image.
 *
 * @param {string} name The name of the social interaction. Twitter || Facebook
 * @param {string} url The post URL.
 */
function createSocialLink(name, url) {
  var a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('style', 'margin: 0 .4em');
  a.onclick = destroyBubble;

  var img = document.createElement('img');
  img.setAttribute('src', chrome.extension.getURL('/img/' + name + '.png'));
  img.setAttribute('title', 'Share on ' + name);
  img.setAttribute('style', 'vertical-align: middle');

  a.appendChild(img);
  return a;
}

/**
 * Creates the bubble overlay. Uses same CSS used in 
 *
 * @param {number} x The mouse x position.
 * @param {number} y The mouse y position.
 * @param {Object<HTMLElement>} src The parent DOM source for the item.
 */
function createBubble(src, event) {
  var bubbleContainer = originalBubbleContainer.cloneNode(true);
  var nodeToFill = bubbleContainer.querySelector('.lgPbs');

  var result = parseURL(src);
  if (result.status) {
    nodeToFill.appendChild(createSocialLink('twitter', 'http://twitter.com/share?url=' + result.url + '&text=' + result.text));
    nodeToFill.appendChild(createSocialLink('facebook', 'http://www.facebook.com/sharer.php?u=' + result.url + '&t=' + result.text));
    nodeToFill.appendChild(createSocialLink('linkedin', 'http://www.linkedin.com/shareArticle?mini=true&url=' + result.url + '&title=' + result.title + '&summary=' + result.text));
  } else {
    nodeToFill.appendChild(document.createTextNode('Cannot find URL, please file bug to developer. hello@mohamedmansour.com'));
  }

  var closeCross = bubbleContainer.querySelector('.tk3N6e-Ca-kmh2Gb');
  closeCross.onclick = destroyBubble;
  
  src.parentNode.appendChild(bubbleContainer);
}

/**
 * On Click event for when sending the link.
 *
 * @param {Object<MouseEvent>} event The mouse event.
 */
function onSendClick(event) {
  var element = event.srcElement.parentNode.querySelector('.tk3N6e-Ca');
  if (!element) {
    createBubble(event.srcElement, event);
  }
  else {
    element.style.display = 'block';
  }
}

/**
 * Render the "Share on ..." Link on each post.
 */
function render() {
  var actionBars = document.querySelectorAll('.a-f-i-bg');
  for (var i = 0; i < actionBars.length; i++) {
    var actionBar = actionBars[i];
    // Check if we already injected in this bar, if so, no need to do it again.
    if (!actionBar.classList.contains('gpi-crx')) {
      var shareNode = originalShareNode.cloneNode(true);
      shareNode.onclick = onSendClick;
      actionBar.appendChild(originalTextNode.cloneNode(true));
      actionBar.appendChild(shareNode);
      actionBar.classList.add('gpi-crx');
    }
  }
}

// API
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.method == 'render') {
    render();
  }
});

// When first injected, render the items.
render();