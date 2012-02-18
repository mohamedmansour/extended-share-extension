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
  $('button-close').addEventListener('click', onClose, false);
  $('release-notes').addEventListener('click', onReleaseNotes, false);
}

/**
 * When release notes is clicked.
 */
function onReleaseNotes() {
  window.open(chrome.extension.getURL('updates.html'));
}

/**
 *  When the options window is closed;
 */
function onClose() {
  window.close();
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

  var optElement = $('opt_out');
  optElement.addEventListener('click', function(e) {
    bkg.settings.opt_out = optElement.checked;
  });
  optElement.checked = bkg.settings.opt_out;

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
      }
    }
  }
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
  label.addEventListener('click', function(e) {
    shareUpdated();
  });
  return label;
}
