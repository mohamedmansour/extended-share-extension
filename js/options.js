/**
 * Options controller.
 *
 * @author Mohamed Mansour 2011 (http://mohamedmansour.com)
 */
 
// Extensions pages can all have access to the bacground page.
var bkg = chrome.extension.getBackgroundPage();

// When the DOM is loaded, make sure all the saved info is restored.
window.addEventListener('load', onLoad, false);

/**
 * When the options window has been loaded.
 */
function onLoad() {
  onRestore();
  onRenderGooglePlus();
  onRenderUpdate();
  $('button-close').addEventListener('click', onClose, false);
  $('donate').addEventListener('click', onDonate, false);
  $('charity').addEventListener('click', onCharity, false);
}

/**
 *  When the options window is closed;
 */
function onClose() {
  window.close();
}

function onDonate() {
  chrome.tabs.create({url: 'http://mohamedmansour.com/donate'});
}

function onCharity() {
  chrome.tabs.create({url: 'http://www.crowdrise.com/code-for-charity'});
}

function onRenderGooglePlus() {
  var script = document.createElement('script');
  script.src = 'https://apis.google.com/js/plusone.js';
  script.innerText = '{lang: "en"}';
  document.body.appendChild(script);
}

function onRenderUpdate() {
  if (location.hash === '#updated') {
    var iframeContainer = document.createElement('div');
    iframeContainer.id = 'updatecontainer';
    
    var closeContainer = document.createElement('div');
    closeContainer.innerText = 'close dialog';
    iframeContainer.appendChild(closeContainer);
    iframeContainer.onclick = function(e) {
      iframeContainer.parentNode.removeChild(iframeContainer);
    };
    
    var iframe = document.createElement('iframe');
    iframe.id = 'updateframe';
    iframe.src = chrome.extension.getURL('updates.html');
    iframeContainer.appendChild(iframe);
    document.body.appendChild(iframeContainer);
  }
}

function shareRendered(shareElement) {
  var labelElement = shareElement.parentNode;
  var classList = labelElement.classList;
  if (shareElement.checked) {
    classList.add('checked');
  }
  else {
    classList.remove('checked');
  }
}

/**
 * Saves options to localStorage.
 */
function shareUpdated() {  
  var shares = [];
  var shareNodes = document.querySelectorAll("input[name='shares']:checked");
  for (var i = 0; i < shareNodes.length; i++) {
    shares.push(shareNodes[i].id);
  }
  bkg.settings.shares = shares;
  bkg.backgroundController.updateSettings();
}

/**
* Restore all options.
*/
function onRestore() {
  // Restore settings.
  $('version').innerHTML = ' (v' + bkg.settings.version + ')';
  
  addCheckboxOption('opt_out');
  addCheckboxOption('open_as_popup');
  addCheckboxOption('auto_close_shelf');
  addCheckboxOption('share_limited');
  
  var container_shares = $('container-shares');
  for (var share in Shares) {
    if (Shares.hasOwnProperty(share)) {
      container_shares.appendChild(createSharesItem(share));
     }
  }
  
  if (bkg.settings.shares) {
    var shares = bkg.settings.shares;
    for (var share in shares) {
      var shareDOM =  $(shares[share]);
      if (shareDOM) {
        shareDOM.checked = true;
        shareRendered(shareDOM);
      }
    }
  }
}

function addCheckboxOption(shareName) {
  var elt = $(shareName);
  elt.addEventListener('click', function(e) {
    bkg.settings[shareName] = elt.checked;
    bkg.backgroundController.updateSettings();
  });
  elt.checked = bkg.settings[shareName];
}

/**
 * Creates the share item for each social feed.
 *
 * @param {object} shareItem The item that is being shared for social.
 * @return the DOM to create.
 */
function createSharesItem(share) {
  var shareItem = Shares[share];

  // Render label.
  var label = document.createElement('label');
  label.setAttribute('class', 'shareIcon');
  label.setAttribute('for', share);

  // Render input.
  var input = document.createElement('input');
  input.setAttribute('type', 'checkbox');
  input.setAttribute('name', 'shares');
  input.setAttribute('id', share);
  label.appendChild(input);

  // Render icon.
  var icon = document.createElement('image');
  icon.src = shareItem.icon;
  icon.title = shareItem.name;
  label.appendChild(icon);

  // Render name.
  var name = document.createElement('p');
  name.innerText = shareItem.name;
  label.appendChild(name);

  // Persist event.
  input.addEventListener('click', function(e) {
    shareRendered(e.target);
    shareUpdated();
  });

  return label;
}
