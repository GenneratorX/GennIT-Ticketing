'use strict';

const messageInput = document.getElementById('messageInput');
const messageSendButton = document.getElementById('send-message');

if (messageInput !== null && messageSendButton !== null) {
  messageInput.onkeyup = onKeyUpMessageInput;
  messageInput.onblur = onBlurMessageInput;
  messageSendButton.onclick = onClickMessageSendButton;
}

/**
 * Event handlers
 */

function onKeyUpMessageInput() {
  const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
  if (messageInput.value.length > 19) {
    setBorderColor(messageInput, 'green');
  } else {
    if (messageInput.value.length !== 0) {
      setBorderColor(messageInput, 'red');
    } else {
      setBorderColor(messageInput);
    }
  }
}

function onBlurMessageInput() {
  const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
  messageInput.value = cleanTextArea(messageInput.value);
  onKeyUpMessageInput();
}

function onClickMessageSendButton(event: MouseEvent) {
  const messageInput = document.getElementById('messageInput') as HTMLInputElement;
  if (messageInput.className === 'green') {
    request('PATCH', window.location.pathname, {
      'event': 'sendMessage',
      'message': messageInput.value,
    })
      .then(({ body: response }) => {
        if (response['status'] === 'success') {
          location.reload();
        } else {
          snackbar('Ceva nu a mers bine. Mai încearcă odată!', 'red');
        }
      })
      .catch(() => {
        snackbar('Ceva nu a mers bine. Mai încearcă odată!', 'red');
      });
  } else {
    snackbar('Mesajul trebuie să conțină minim 20 de caractere!', 'red');
  }
  event.preventDefault();
}
