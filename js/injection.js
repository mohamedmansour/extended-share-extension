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
      text = escape(text.textContent.substring(0, 100));
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
  document.body.appendChild(dialogGlassPane);

  var closeButton = document.createElement('div');
  closeButton.setAttribute('role', 'button');
  closeButton.setAttribute('class', 'd-s-r tk3N6e-e tk3N6e-e-vj');
  closeButton.setAttribute('style', '-webkit-user-select: none');
  closeButton.innerHTML = 'Close';
  closeButton.onclick = destroyDialog;

  var dialogNode = document.createElement('div');
  dialogNode.setAttribute('role', 'dialog');
  dialogNode.setAttribute('class', 'va-Q');
  dialogNode.style.width = '175px';
  var result = parseURL(src);
  var innerHTML = '<div class="va-Q-R"><span class="va-Q-R-G">Send To ... </span></div>' +
                  '<div class="va-Q-p">';
  if (result.status) {
    innerHTML += '<a href="http://twitter.com/share?url=' + result.url + '&text=' + result.text + '" style="margin: 0 10px;">' +
                 '<img src="' + chrome.extension.getURL('/img/twitter.jpg') + '" title="Share on Twitter"/></a>' + 
                 '<a href="http://www.facebook.com/sharer.php?u=' + result.url + '&t=' + result.text + '" style="margin: 0 10px;">' +
                 '<img src="' + chrome.extension.getURL('/img/facebook.jpg') + '" title="Share on Facebook"/></a>';
  }
  else {
    innerHTML += 'Cannot find URL, please file bug to developer. hello@mohamedmansour.com';
  }
  innerHTML += '</div>';

  dialogNode.innerHTML = innerHTML;
  dialogNode.style.left = (x - 100) + 'px';
  dialogNode.style.top = (y - 50) + 'px';
  dialogNode.appendChild(closeButton);
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