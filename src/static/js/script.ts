'use strict';

/**
 * Load all preloaded CSS files in order
 */
const links = document.head.getElementsByTagName('link');
for (let i = 0; i < links.length; i++) {
  if (links[i].as === 'style') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = links[i].href;
    document.head.appendChild(link);
  }
}

/**
 * Make the webpage visible again after loading all CSS files to prevent FOUC/FOUT
 */
const scripts = document.head.getElementsByTagName('script');
for (let i = 0; i < scripts.length; i++) {
  if (scripts[i].nonce !== undefined) {
    const reveal = document.createElement('style');
    reveal.nonce = scripts[i].nonce;
    reveal.textContent = 'body{opacity:1;overflow:auto;scrollbar-color:#363636 transparent;visibility:visible}';
    document.head.appendChild(reveal);
    i = scripts.length;
  }
}
