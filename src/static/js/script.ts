/* eslint-disable no-unused-vars */
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

/**
 * Sets attributes on a HTML element
 * @param elem HTML element
 * @param attr Object containing attribute names and their values
 */
function setAttributes(elem: HTMLElement, attr: { [property: string]: string }): void {
  for (const n in attr) {
    if (!Object.prototype.hasOwnProperty.call(elem, n)) {
      elem.setAttribute(n, attr[n]);
    }
  }
}

/**
 * Displays a snackbar notification
 * @param msg Snackbar message
 * @param type Snackbar color [0 - green | 1 - orange | 2 - red | 3 - blue]
 */
function snackbar(msg: string, type: 0 | 1 | 2 | 3): void {
  const snackB = document.createElement('div');
  snackB.setAttribute('id', 'snackbar');
  const snackC = document.createElement('div');
  snackC.setAttribute('id', 'snackC');
  snackC.textContent = msg;
  switch (type) {
    case 0:
      snackC.className = 'green';
      break;
    case 1:
      snackC.className = 'orange';
      break;
    case 2:
      snackC.className = 'red';
      break;
    case 3:
      snackC.className = 'blue';
      break;
  }
  snackB.appendChild(snackC);
  document.body.appendChild(snackB);
  snackB.className = 'show';
  setTimeout(function() {
    if (snackB && snackB.parentNode) {
      snackB.className = '';
      snackB.parentNode.removeChild(snackB);
    }
  }, 4000);
}

/**
 * Sends a fetch request
 * @param method HTTP method to use for the request
 * @param url URL to send the request to
 * @param body Request body
 * @param fetchOptions Fetch API request options
 * @returns Response object if the request was successful (code 200) or error code otherwise
 */
function request(method: 'GET' | 'POST', url: string, body: { [property: string]: any }, fetchOptions?: RequestInit) {
  let requestParameters: RequestInit = {
    method: method,
    mode: 'same-origin',
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  };

  requestParameters = { ...requestParameters, ...fetchOptions };

  return fetch(url, requestParameters)
    .then(response => {
      if (response.ok === true) {
        return response.json();
      }
      throw new Error(response.status.toString());
    });
}

/**
 * Generates a greeting message based on the time of the day
 * @returns Greeting message
 */
function greetingMessage(): 'Ziua bună' | 'Bună seara' | 'Neața' {
  const currentHour = new Date().getHours();
  if (currentHour >= 8 && currentHour < 18) {
    return 'Ziua bună';
  } else {
    if (currentHour >= 18 && currentHour <= 23) {
      return 'Bună seara';
    }
    return 'Neața';
  }
}
