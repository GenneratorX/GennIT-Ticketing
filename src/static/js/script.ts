/* eslint-disable no-unused-vars */
'use strict';

/**
 * Load all preloaded CSS files in order with the main style last
 */
const links = document.head.getElementsByTagName('link');
for (let i = 0; i < links.length; i++) {
  if (links[i].as === 'style' && links[i].href !== 'https://static.gennerator.com/css/style.css') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = links[i].href;
    document.head.appendChild(link);
  }
}
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://static.gennerator.com/css/style.css';
document.head.appendChild(link);

/**
 * Sets attributes on a HTML element
 * @param element HTML element
 * @param attributes Object containing attribute names and their values
 */
function setAttributes(element: HTMLElement, attributes: { [attribute: string]: string }): void {
  for (const attribute in attributes) {
    if (!Object.prototype.hasOwnProperty.call(element, attribute)) {
      element.setAttribute(attribute, attributes[attribute]);
    }
  }
}

/**
 * Displays a snackbar notification
 * @param message Snackbar message
 * @param color Snackbar color
 */
function snackbar(message: string, color: 'green' | 'orange' | 'red' | 'blue'): void {
  const snackB = document.createElement('div');
  snackB.setAttribute('id', 'snackbar');
  const snackC = document.createElement('div');
  snackC.setAttribute('id', 'snackC');
  snackC.textContent = message;
  snackC.className = color;
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
 * @returns Response body object
 */
function request(
  method: 'GET' | 'POST',
  url: string,
  body?: { [property: string]: any },
  fetchOptions?: RequestInit
): Promise<{ [property: string]: any, responseStatusCode: number }> {

  let requestParameters: RequestInit = {
    method: method,
    mode: 'same-origin',
    credentials: 'same-origin',
    referrerPolicy: 'same-origin',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json; charset=utf-8',
    },
  };
  if (method === 'POST') {
    requestParameters.body = JSON.stringify(body);
  }

  requestParameters = { ...requestParameters, ...fetchOptions };

  return fetch(url, requestParameters)
    .then(response => {
      const statusCode = response.status;
      const body = response.json();
      return Promise.all([body, statusCode]);
    })
    .then(fullResponse => ({ ...fullResponse[0], ...{ 'responseStatusCode': fullResponse[1] } }))
    .catch((error: Error) => {
      switch (error.name) {
        case 'TypeError':
          if (error.message === 'Failed to fetch') {
            throw new Error('network error');
          }
          break;
        case 'SyntaxError':
          if (error.message.includes('in JSON at position') === true) {
            throw new Error('invalid json');
          }
          break;
        default: throw error;
      }
    });
}

/**
 * Generates a greeting message based on the time of the day
 * @returns Greeting message
 */
function greetingMessage() {
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

/**
 * Sets the border color of a HTML element
 * @param htmlElement HTML element to set the border color
 * @param color Border color
 */
function setBorderColor(htmlElement: HTMLElement, color?: 'red' | 'green') {
  const htmlElementClassList = htmlElement.classList;
  htmlElementClassList.remove('red', 'green');
  switch (color) {
    case 'green': htmlElementClassList.add('green'); break;
    case 'red': htmlElementClassList.add('red'); break;
  }
}

/**
 * Removes leading and trailing whitespace and consecutive whitespaces
 * @param text String to remove the whitespace from
 * @returns Clean string
 */
function trimWhitespace(text: string) {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Checks if the string is a valid date
 * @param date String to check
 * @returns True if string is a valid date, false otherwise
 */
function isDate(date: string) {
  if (isNaN(Date.parse(date))) {
    return false;
  } else {
    if (date !== (new Date(date)).toISOString().substr(0, 10)) {
      return false;
    }
  }
  return true;
}

/**
 * Universal event handler that allows only numbers
 * @param event Keyboard event
 */
function inputAllowOnlyNumbers(event: KeyboardEvent) {
  if (
    (event.keyCode < 48 || event.keyCode > 58) && // top numbers
    (event.keyCode < 96 || event.keyCode > 105) && // numpad numbers
    (event.keyCode < 37 || event.keyCode > 40) && // arrows
    (event.keyCode !== 8 && event.keyCode !== 46) && // BACKSPACE and DELETE
    (event.keyCode !== 9 && event.keyCode !== 116) // TAB and F5
  ) {
    event.preventDefault();
  }
}
