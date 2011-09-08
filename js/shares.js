/**
 * Shares List.
 *
 * The format to share would be adding a JSON object that has the keys:
 *   - name (The name of the extension that appears on the hover)
 *   - icon (relative path of the icon)
 *   - url (contains some attributes that will be replaced)
 *   - trim  (true to trim upto 100 chars)
 *
 * The URL has the following keys that will be replaced:
 *   - ${link} The link to share.
 *   - ${text} The text to place.
 *   - ${title} The title of the post.
 *
 * @author Mohamed Mansour 2011 (http://mohamedmansour.com)
 */
Shares = {
  twitter: {
    name: 'Twitter',
    icon: '/img/twitter.png',
    url: 'http://twitter.com/share?url=${link}&text=${text}',
    trim: true
  },
  facebook: {
    name: 'Facebook',
    icon: '/img/facebook.png',
    url: 'http://www.facebook.com/sharer.php?u=${link}&t=${text}',
    trim: false
  },
  linkedin: {
    name: 'Linkedin',
    icon: '/img/linkedin.png',
    url: 'http://www.linkedin.com/shareArticle?mini=true&url=${link}&title=${title}&summary=${text}',
    trim: false
  },
  tumblr: {
    name: 'Tumblr',
    icon: '/img/tumblr.png',
    url: 'http://www.tumblr.com/share?v=3&u=${link}&t=${text}',
    trim: false
  },
  identica: {
    name: 'Identica',
    icon: '/img/identica.png',
    url: 'http://identi.ca/notice/new?status_textarea=${text} ${link}',
    trim: false
  },
  posterous: {
    name: 'Posterous',
    icon: '/img/posterous.png',
    url: 'http://posterous.com/share?linkto=${link}&title=${title}&selection=${text}',
    trim: false
  },
  reddit: {
    name: 'Reddit',
    icon: '/img/reddit.png',
    url: 'http://www.reddit.com/submit?url=${link}&title=${title}',
    trim: false
  },
  pingfm: {
    name: 'ping.fm',
    icon: '/img/pingfm.png',
    url: 'http://ping.fm/ref/?link=${link}&title=${title}',
    trim: false
  },
  hyves: {
    name: 'hyves',
    icon: '/img/hyves.png',
    url: 'http://www.hyves-share.nl/button/tip/?tipcategoryid=12&rating=5&title=${title}&body=${text}[url=${link}]${link}[/url]',
    trim: false
  },
  netvibes: {
    name: 'Netvibes',
    icon: '/img/netvibes.png',
    url: 'http://www.addtoany.com/add_to/netvibes_share?linkurl=${link}&linkname=${title}',
    trim: false
  },
  technorati: {
    name: 'Technorati',
    icon: '/img/technorati.png',
    url: 'http://technorati.com/faves?sub=addfavbtn&add=${link}',
    trim: false
  },
  stumbleupon: {
    name: 'StumbleUpon',
    icon: '/img/stumbleupon.png',
    url: 'http://www.stumbleupon.com/submit?url=${link}&title=${title}',
    trim: false
  },
  yahoo: {
    name: 'Yahoo! Bookmarks',
    icon: '/img/yahoo.png',
    url: 'http://bookmarks.yahoo.com/toolbar/savebm?u=${link}&t=${title}',
    trim: false
  },
  blogger: {
    name: 'Google Blogger',
    icon: '/img/blogger.png',
    url: 'http://www.blogger.com/blog-this.g?t&u=${link}&title=${title}&n=${text}&pli=1',
    trim: false
  },
  digg: {
    name: 'Digg',
    icon: '/img/digg.png',
    url: 'http://digg.com/submit?phase=2&url=${link}&title=${title}&summary=${text}',
    trim: false
  },
  google: {
    name: 'Google Bookmarks',
    icon: '/img/google.png',
    url: 'ttps://www.google.com/bookmarks/mark?op=edit&bkmk=${link}&title=${title}',
    trim: false
  }
};
