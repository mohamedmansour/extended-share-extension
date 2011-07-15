// Extensions pages can all have access to the bacground page.
var bkg = chrome.extension.getBackgroundPage();

// When the DOM is loaded, make sure all the saved info is restored.
window.addEventListener('load', onLoad, false);

/**
 * When the options window has been loaded.
 */
function onLoad() {
  onRestore();
  $('button-save').addEventListener('click', onSave, false);
  $('button-close').addEventListener('click', onClose, false);
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
function onSave() {
  // Save settings.
  bkg.settings.opt_out = $('opt_out').checked;

  var shares = [];
  var shareNodes = document.querySelectorAll("input[name='shares']");
  for (var node in shareNodes) {
    var share = shareNodes[node];
    if (share.checked) {
      shares.push(share.id);
    }
  }
  bkg.settings.shares = shares;

  // Update status to let user know options were saved.
  var info = $('info-message');
  info.style.display = 'inline';
  info.style.opacity = 1;
  setTimeout(function() {
    info.style.opacity = 0.0;
  }, 1000);
}

/**
* Restore all options.
*/
function onRestore() {
  // Restore settings.
  $('version').innerHTML = ' (v' + bkg.settings.version + ')';
  $('opt_out').checked = bkg.settings.opt_out;

  var container_shares = $('container-shares');
  for (var i in Shares) {
     var share = Shares[i];
     container_shares.appendChild(createSharesItem(share.name));
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

function createSharesItem(shareItem) {
  //var container = document.createElement('p');
  var item = shareItem.toLowerCase();
  
  // Render label.
  var label = document.createElement('label');
  label.setAttribute('for', item);

  // Text formatted into Camel Case
  var item_formatted = item.split('_').map(function(v){
    return v.slice(0,1).toUpperCase() + v.slice(1);
  }).join(' ');

  label.appendChild(document.createTextNode(item_formatted));

  // Render input.
  var input = document.createElement('input');
  input.setAttribute('type', 'checkbox');
  input.setAttribute('name', 'shares');
  input.setAttribute('id', item);
  label.appendChild(input);
  
  return label;
}













