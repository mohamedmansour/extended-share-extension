// Shared DOM.
var originalTextNode = document.createTextNode('  -  ');
var originalShareNode = document.createElement('span');
originalShareNode.setAttribute('role', 'button');
originalShareNode.setAttribute('class', 'd-h external-share');
originalShareNode.innerHTML = 'Send to ...';

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
    text: text
  };
}

/**
 * Removes the dialog from the DOM. Same functionality as the share button.
 *
 * @param {Object<MouseEvent>} event The mouse event.
 */
function destroyDialog(event) {
  var dialogGlassPane = document.querySelector('.va-Q-zb');
  var dialogNode = document.querySelector('.va-Q');
  dialogGlassPane.parentNode.removeChild(dialogGlassPane);
  dialogNode.parentNode.removeChild(dialogNode);

  // Cleanup a ESC hook.
  window.removeEventListener('keyup', onKeyPressed, false);
}

/**
 * On global keypress to watch for ESC key.
 *
 * @param {Object<KeyEvent>} event The key event.
 */
function onKeyPressed(event) {
  if (event.keyCode  == 27) { // ESCAPE.
    destroyDialog();
  }
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
  a.setAttribute('style', 'margin: 0 0 10px 5px');
  a.onclick = destroyDialog;

  var img = document.createElement('img');
  img.setAttribute('src', chrome.extension.getURL('/img/' + name + '.jpg'));
  img.setAttribute('title', 'Share on ' + name);
  img.setAttribute('style', 'vertical-align: middle');

  a.appendChild(img);
  return a;
}

/**
 * Creates the Dialog overlay. Uses the same Dialog Google does for the share
 * button.
 *
 * @param {number} x The mouse x position.
 * @param {number} y The mouse y position.
 * @param {Object<HTMLElement>} src The parent DOM source for the item.
 */
function createDialog(x, y, src) {
  var dialogGlassPane = document.createElement('div');
  dialogGlassPane.setAttribute('class', 'va-Q-zb');
  dialogGlassPane.style.opacity = 0.75;
  dialogGlassPane.style.width = window.innerWidth + 'px';
  dialogGlassPane.style.height = window.innerHeight + 'px';
  dialogGlassPane.style.position = 'fixed';
  dialogGlassPane.onclick = destroyDialog;
  document.body.appendChild(dialogGlassPane);

  var dialogNode = document.createElement('div');
  dialogNode.setAttribute('role', 'dialog');
  dialogNode.setAttribute('class', 'va-Q');
  dialogNode.style.width = '165px';
  dialogNode.style.left = (x - 100) + 'px';
  dialogNode.style.top = (y - 50) + 'px';
  dialogNode.style.padding = '10px';

  var dialogHeader = document.createElement('span');
  dialogHeader.setAttribute('style', 'line-height: 32px; font: normal 18px arial, sans-serif; cursor: default');
  dialogHeader.innerHTML = 'Send To ...';
  dialogNode.appendChild(dialogHeader);

  var result = parseURL(src);
  if (result.status) {
    dialogNode.appendChild(createSocialLink('twitter', 'http://twitter.com/share?url=' + result.url + '&text=' + result.text));
    dialogNode.appendChild(createSocialLink('facebook', 'http://www.facebook.com/sharer.php?u=' + result.url + '&t=' + result.text));
  } else {
    dialogNode.appendChild(document.createTextNode('Cannot find URL, please file bug to developer. hello@mohamedmansour.com'));
  }

  // Register a ESC hook.
  window.addEventListener('keyup', onKeyPressed, false);
  document.body.appendChild(dialogNode);
}

/**
 * On Click event for when sending the link.
 *
 * @param {Object<MouseEvent>} event The mouse event.
 */
function onSendClick(event) {
  createDialog(event.pageX, event.pageY, event.srcElement)
}

/**
 * Render the "Send to ..." Link on each post.
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