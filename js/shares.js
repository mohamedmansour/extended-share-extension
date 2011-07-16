/**
 * Shares List.
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
  }
};
