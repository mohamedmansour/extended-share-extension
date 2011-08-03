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
    url: ' http://posterous.com/share?linkto=${link}&title=${title}&selection=${text}',
    trim: false
  }
};
