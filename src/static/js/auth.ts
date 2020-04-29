'use strict';

const authElements = {
  /**
   * Form title
   */
  authTitle: document.getElementById('authTitle') as HTMLHeadingElement,
  /**
   * Form
   */
  submitForm: document.getElementById('auth') as HTMLFormElement,
  /**
   * Form submit button
   */
  submitButton: document.getElementById('submitB') as HTMLInputElement,
  /**
   * Form menu item 1
   */
  authMenuItem1: document.getElementById('authMenuItem1') as HTMLAnchorElement,
  /**
   * Form menu item 1
   */
  authMenuItem2: document.getElementById('authMenuItem2') as HTMLAnchorElement,
  /**
   * Username input
   */
  usernameInput: document.getElementById('username') as HTMLInputElement,
  /**
   * Password input
   */
  passwordInput: document.getElementById('password') as HTMLInputElement,
  /**
   * Retype password input
   */
  repeatPasswordInput: document.getElementById('repeatPassword') as HTMLInputElement,
  /**
   * Email input
   */
  emailInput: document.getElementById('email') as HTMLInputElement,
  /**
   * Agreement button
   */
  checkBoxLabel: document.getElementById('chkLabel') as HTMLLabelElement,
  /**
   * Information box
   */
  infoBox: document.getElementById('info') as HTMLSpanElement,
};

const greenBorder = 'login green';

const userRegexp = /^[a-zA-Z\d][a-zA-Z\d!?$^&*._-]{5,39}$/;
const emailRegexp = new RegExp(
  '^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&\'*+/0-9=?A-Z^_`a-z{|}~]+(\\.[-!#$%&\'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]' +
  '([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$');

let currentWindow: 'signIn' | 'signUp' | 'forgotPassword' | 'resendActivationMail' | 'resetPassword' = 'signIn';

/**
 * Displays the sign in menu
 */
function displaySignIn() {
  const {
    authTitle,
    authMenuItem1,
    authMenuItem2,
    checkBoxLabel,
    emailInput,
    infoBox,
    passwordInput,
    repeatPasswordInput,
    submitButton,
    submitForm,
    usernameInput,
  } = authElements;

  switch (currentWindow) {
    case 'signUp':
      submitForm.removeChild(repeatPasswordInput);
      submitForm.removeChild(emailInput);
      submitForm.removeChild(checkBoxLabel);
      passwordInput.setAttribute('autocomplete', 'current-password');
      break;
    case 'forgotPassword':
      submitForm.removeChild(emailInput);
      submitForm.insertBefore(usernameInput, submitButton);
      submitForm.insertBefore(passwordInput, submitButton);
      break;
    case 'resendActivationMail':
      submitForm.removeChild(infoBox);
      submitForm.removeChild(emailInput);
      submitForm.insertBefore(usernameInput, submitButton);
      submitForm.insertBefore(passwordInput, submitButton);
      break;
    case 'resetPassword':
      submitForm.removeChild(repeatPasswordInput);
      submitForm.insertBefore(usernameInput, passwordInput);
      break;
  }

  authTitle.textContent = 'Autentificare';
  authMenuItem1.textContent = 'Ai uitat parola?';
  authMenuItem2.textContent = 'Nu ai cont? Creează unul!';
  authMenuItem1.onclick = displayForgotPassword;
  authMenuItem2.onclick = displaySignUp;

  currentWindow = 'signIn';
  usernameInputKeyUp();
}

/**
 * Displays the sign up menu
 */
function displaySignUp() {
  const {
    authMenuItem1,
    authMenuItem2,
    authTitle,
    passwordInput,
  } = authElements;

  addRepeatPasswordInput();
  addEmailInput();
  addAgreementCheckbox();

  passwordInput.setAttribute('autocomplete', 'new-password');

  authTitle.textContent = 'Creare cont';
  authMenuItem1.textContent = 'Ai cont? Loghează-te!';
  authMenuItem2.textContent = '';
  authMenuItem1.onclick = displaySignIn;

  currentWindow = 'signUp';
  usernameInputKeyUp();
  repeatPasswordInputKeyUp();
}

/**
 * Displays the forgot password menu
 */
function displayForgotPassword() {
  const {
    authMenuItem1,
    authMenuItem2,
    authTitle,
    passwordInput,
    submitForm,
    usernameInput,
  } = authElements;

  submitForm.removeChild(usernameInput);
  submitForm.removeChild(passwordInput);

  addEmailInput();

  authTitle.textContent = 'Recuperare parolă';
  authMenuItem1.textContent = 'Înapoi';
  authMenuItem1.onclick = displaySignIn;
  authMenuItem2.textContent = '';

  currentWindow = 'forgotPassword';
}

/**
 * Displays the resend activation email menu
 */
function displayResendActivationMail() {
  const {
    authMenuItem1,
    authMenuItem2,
    authTitle,
    passwordInput,
    submitForm,
    usernameInput,
  } = authElements;

  submitForm.removeChild(usernameInput);
  submitForm.removeChild(passwordInput);

  addInfoBox();
  addEmailInput();

  authTitle.textContent = 'Activare cont';
  authMenuItem1.textContent = 'Înapoi';
  authMenuItem1.onclick = displaySignIn;
  authMenuItem2.textContent = '';

  currentWindow = 'resendActivationMail';
}

/**
 * Displays the reset password menu
 */
function displayResetPassword() {
  const {
    authMenuItem1,
    authMenuItem2,
    authTitle,
    submitForm,
    usernameInput,
  } = authElements;

  submitForm.removeChild(usernameInput);

  addRepeatPasswordInput();

  authTitle.textContent = 'Resetare parolă';
  authMenuItem1.textContent = '';
  authMenuItem2.textContent = '';

  currentWindow = 'resetPassword';
}

/**
 * Adds an e-mail input box
 */
function addEmailInput() {
  if (authElements.emailInput === null) {
    const emailInput = document.createElement('input');
    setAttributes(emailInput, {
      'class': 'login',
      'id': 'email',
      'autocomplete': 'email',
      'maxlength': '254',
      'placeholder': 'E-mail',
      'required': '',
      'type': 'email',
      'spellcheck': 'false',
    });
    emailInput.onkeyup = emailInputKeyUp;
    authElements.emailInput = emailInput;
    authElements.submitForm.insertBefore(emailInput, authElements.submitButton);
  } else {
    authElements.submitForm.insertBefore(authElements.emailInput, authElements.submitButton);
  }
}

/**
 * Adds a repeat password input box
 */
function addRepeatPasswordInput() {
  if (authElements.repeatPasswordInput === null) {
    const repeatPasswordInput = document.createElement('input');
    setAttributes(repeatPasswordInput, {
      'class': 'login',
      'id': 'repeatPassword',
      'autocomplete': 'new-password',
      'placeholder': 'Repetă parola',
      'required': '',
      'type': 'password',
    });
    repeatPasswordInput.onkeyup = repeatPasswordInputKeyUp;
    authElements.repeatPasswordInput = repeatPasswordInput;
    authElements.submitForm.insertBefore(repeatPasswordInput, authElements.submitButton);
  } else {
    authElements.submitForm.insertBefore(authElements.repeatPasswordInput, authElements.submitButton);
  }
}

/**
 * Adds an accept agreement checkbox
 */
function addAgreementCheckbox() {
  if (authElements.checkBoxLabel === null) {
    const checkBoxLabel = document.createElement('label');
    setAttributes(checkBoxLabel, {
      'class': 'checkbox-label',
      'id': 'chkLabel',
    });
    checkBoxLabel.textContent = 'Accept termenii și condițiile';

    const checkBoxInput = document.createElement('input');
    setAttributes(checkBoxInput, {
      'id': 'chkBox',
      'required': '',
      'type': 'checkbox',
    });
    checkBoxLabel.insertAdjacentElement('afterbegin', checkBoxInput);

    authElements.checkBoxLabel = checkBoxLabel;
    authElements.submitForm.insertBefore(checkBoxLabel, authElements.submitButton);
  } else {
    authElements.submitForm.insertBefore(authElements.checkBoxLabel, authElements.submitButton);
  }
}

/**
 * Adds an info box
 */
function addInfoBox() {
  if (authElements.infoBox === null) {
    const info = document.createElement('span');
    setAttributes(info, {
      'class': 'info',
      'id': 'info',
    });
    info.textContent = 'Încă nu ai primit un e-mail de activare?';

    const infoContent = document.createElement('span');
    infoContent.setAttribute('class', 'info-content');
    infoContent.textContent = 'Introdu adresa de e-mail asociată contului pentru a trimite un nou e-mail de activare!';

    info.appendChild(infoContent);

    authElements.infoBox = info;
    authElements.submitForm.insertBefore(info, authElements.submitButton);
  } else {
    authElements.submitForm.insertBefore(authElements.infoBox, authElements.submitButton);
  }
}

authElements.authMenuItem1.onclick = displayForgotPassword;
authElements.authMenuItem2.onclick = displaySignUp;

authElements.usernameInput.onkeyup = usernameInputKeyUp;
authElements.passwordInput.onkeyup = passwordInputKeyUp;

const resetCode = new URLSearchParams(window.location.search).get('reset');
if (resetCode !== null && resetCode.length === 172) {
  displayResetPassword();
}

// EventHandler functions

let delay: NodeJS.Timeout;
const delayTime = 500;

function usernameInputKeyUp() {
  const { usernameInput } = authElements;
  clearTimeout(delay);
  if (userRegexp.test(usernameInput.value) === true) {
    switch (currentWindow) {
      case 'signIn':
        setBorderColor(usernameInput, 'green');
        break;
      case 'signUp':
        delay = setTimeout(() => {
          request('POST', '/usernameExists', { 'username': usernameInput.value })
            .then(response => {
              if (response['response'] === false) {
                setBorderColor(usernameInput, 'green');
              } else {
                setBorderColor(usernameInput, 'red');
              }
            })
            .catch(() => {
              setBorderColor(usernameInput, 'red');
              snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
            });
        }, delayTime);
        break;
    }
  } else {
    if (usernameInput.value.length === 0) {
      setBorderColor(usernameInput);
    } else {
      setBorderColor(usernameInput, 'red');
    }
  }
}

function passwordInputKeyUp() {
  const { passwordInput, repeatPasswordInput } = authElements;
  if (passwordCheck(passwordInput.value).valid === true) {
    switch (currentWindow) {
      case 'signIn':
        setBorderColor(passwordInput, 'green');
        break;
      case 'signUp':
        setBorderColor(passwordInput, 'green');
        repeatPasswordInputKeyUp();
        break;
      case 'resetPassword':
        setBorderColor(passwordInput, 'green');
        repeatPasswordInputKeyUp();
        break;
    }
  } else {
    if (passwordInput.value.length === 0) {
      setBorderColor(passwordInput);
    } else {
      setBorderColor(passwordInput, 'red');
    }
    if (currentWindow === 'signUp' || currentWindow === 'resetPassword') {
      setBorderColor(repeatPasswordInput);
    }
  }
}

function repeatPasswordInputKeyUp() {
  const { passwordInput, repeatPasswordInput } = authElements;
  if (passwordCheck(passwordInput.value).valid === true) {
    if (repeatPasswordInput.value === passwordInput.value) {
      setBorderColor(repeatPasswordInput, 'green');
    } else {
      setBorderColor(repeatPasswordInput, 'red');
    }
  } else {
    setBorderColor(repeatPasswordInput);
  }
}

function emailInputKeyUp() {
  const { emailInput } = authElements;
  clearTimeout(delay);
  if (emailRegexp.test(emailInput.value) === true) {
    switch (currentWindow) {
      case 'signUp':
        delay = setTimeout(() => {
          request('POST', '/emailExists', { 'email': emailInput.value })
            .then(response => {
              if (response['response'] === false) {
                setBorderColor(emailInput, 'green');
              } else {
                setBorderColor(emailInput, 'red');
              }
            })
            .catch(() => {
              setBorderColor(emailInput, 'red');
              snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
            });
        }, delayTime);
        break;
      case 'forgotPassword':
        setBorderColor(emailInput, 'green');
        break;
      case 'resendActivationMail':
        setBorderColor(emailInput, 'green');
        break;
    }
  } else {
    if (emailInput.value.length === 0) {
      setBorderColor(emailInput);
    } else {
      setBorderColor(emailInput, 'red');
    }
  }
}

authElements.submitForm.addEventListener('submit', event => {
  const { usernameInput, passwordInput, repeatPasswordInput, emailInput, submitForm } = authElements;
  switch (currentWindow) {
    case 'signIn': {
      if (usernameInput.className === greenBorder && passwordInput.className === greenBorder) {
        request('POST', '/signin', { 'username': usernameInput.value, 'password': passwordInput.value })
          .then(response => {
            if (response['response'] === true) {
              document.body.innerHTML = `` +
                `<div class="content">` +
                `<p class="inline">` +
                `${greetingMessage()}, <span class="bold">${response['userName']}</span>!` +
                `</p>` +
                `Te trimitem pe pagina principală imediat!` +
                `</div>`;
              setTimeout(function() {
                window.location.href = '/';
              }, 2500);
            } else {
              switch (response['error']) {
                case 'username or password not found':
                  snackbar('Numele de utilizator sau parola sunt incorecte!', 'red');
                  break;
                case 'user disabled':
                  snackbar('Contul este dezactivat. Verifică adresa de e-mail înregistrată pentru activare!', 'blue');
                  displayResendActivationMail();
                  break;
                case 'internal error':
                  snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
                  break;
              }
            }
          })
          .catch(() => {
            snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
          });
      } else {
        snackbar('Datele introduse sunt incorecte!', 'red');
      }
      break;
    }
    case 'signUp': {
      if (
        usernameInput.className === greenBorder &&
        passwordInput.className === greenBorder &&
        repeatPasswordInput.className === greenBorder &&
        emailInput.className === greenBorder
      ) {
        request('POST', '/signup', {
          'username': usernameInput.value,
          'password': passwordInput.value,
          'email': emailInput.value,
          'policy': (document.getElementById('chkBox') as HTMLInputElement).checked,
        })
          .then(response => {
            if (response['response'] === true) {
              snackbar('Cont creat cu succes!', 'green');
              displaySignIn();
              submitForm.reset();
              setBorderColor(usernameInput);
              setBorderColor(passwordInput);
            } else {
              switch (response['error']) {
                case 'invalid username':
                  snackbar('Numele de utilizator este invalid!', 'red');
                  break;
                case 'invalid password':
                  snackbar('Parola este invalidă!', 'red');
                  break;
                case 'invalid email':
                  snackbar('Adresa de e-mail este invalidă!', 'red');
                  break;
                case 'username exists':
                  snackbar('Numele de utilizator există deja!', 'red');
                  break;
                case 'email exists':
                  snackbar('Adresa e-mail există deja!', 'red');
                  break;
                case 'internal error':
                  snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
                  break;
              }
            }
          })
          .catch(() => {
            snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
          });
      } else {
        snackbar('Datele introduse sunt incorecte!', 'red');
      }
      break;
    }
    case 'forgotPassword': {
      if (emailInput.className === greenBorder) {
        request('POST', '/forgotPassword', { 'email': emailInput.value })
          .then(response => {
            if (response['response'] === true) {
              snackbar('Verificați adresa e-mail introdusă pentru instrucțiunile de resetare a parolei!', 'blue');
              displaySignIn();
            } else {
              snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
            }
          })
          .catch(() => {
            snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
          });
      }
      break;
    }
    case 'resendActivationMail': {

      break;
    }
    case 'resetPassword': {
      if (passwordInput.className === greenBorder && repeatPasswordInput.className === greenBorder) {
        request('POST', '/resetPasswordByEmail', { 'password': passwordInput.value, 'resetCode': resetCode })
          .then(response => {
            if (response['response'] === true) {
              snackbar('Parola a fost resetată cu success!', 'green');
              displaySignIn();
              submitForm.reset();
              setBorderColor(passwordInput);
            } else {
              switch (response['error']) {
                case 'invalid password':
                  snackbar('Parola este invalidă!', 'red');
                  break;
                case 'invalid reset code':
                  snackbar('Codul de resetare al parolei este invalid/expirat!', 'red');
                  break;
                case 'internal error':
                  snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
                  break;
              }
            }
          })
          .catch(() => {
            snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
          });
      }
      break;
    }
  }
  event.preventDefault();
});

/**
 * Checks if the password requirements are met
 * @param password Password
 * @returns Password check result
 */
function passwordCheck(password: string) {
  let length = false;
  let uppercase = false;
  let lowercase = false;
  let digit = false;
  let special = false;
  if (password.length >= 8) {
    length = true;
    for (let i = 0; i < password.length; i++) {
      const c = password.charAt(i);
      if (uppercase === true && lowercase === true && digit === true && special === true) {
        return { valid: true };
      } else {
        if (uppercase === false && c >= 'A' && c <= 'Z') {
          uppercase = true;
          continue;
        }
        if (lowercase === false && c >= 'a' && c <= 'z') {
          lowercase = true;
          continue;
        }
        if (digit === false && c >= '0' && c <= '9') {
          digit = true;
          continue;
        }
        if (special === false && (c < 'A' || c > 'Z') && (c < 'a' || c > 'z') && (c < '0' || c > '9')) {
          special = true;
        }
      }
    }
  }
  if (uppercase === true && lowercase === true && digit === true && special === true) {
    return { valid: true };
  }
  return {
    valid: false,
    length: length,
    uppercase: uppercase,
    lowercase: lowercase,
    digit: digit,
    special: special,
  };
}

/**
 * Sets the border color of a HTML input element
 * @param inputElement HTML input element to set the border color
 * @param color Border color
 */
function setBorderColor(inputElement: HTMLInputElement, color?: 'red' | 'green') {
  switch (color) {
    case 'green': inputElement.className = greenBorder; break;
    case 'red': inputElement.className = 'login red'; break;
    default: inputElement.className = 'login';
  }
}
