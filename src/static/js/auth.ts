'use strict';

const submitForm = document.getElementById('auth') as HTMLFormElement;

const userBox = document.getElementById('username') as HTMLInputElement;
const passBox = document.getElementById('password') as HTMLInputElement;

const createAcc = document.getElementById('createAcc') as HTMLAnchorElement;
const forgotPass = document.getElementById('forgotPass') as HTMLAnchorElement;
const lText = document.getElementById('lText') as HTMLHeadingElement;

const MIN_PASSWORD_LENGTH = 8;

let repeatBox: HTMLInputElement;
let emailBox: HTMLInputElement;
let checkLabel: HTMLLabelElement;
let repeatBoxEnabled = false;

const green = 'login lGreen';
const red = 'login lRed';
const gray = 'login';

const userRegexp = /^[a-zA-Z\d][a-zA-Z\d!?$^&*._-]{5,39}$/;
const emailRegexp = new RegExp(
  '^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&\'*+/0-9=?A-Z^_`a-z{|}~]+(\\.[-!#$%&\'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]' +
  '([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$');

forgotPass.onclick = function(): void {
  snackbar('Asta e! 🤷‍♂️', 'green');
};

createAcc.onclick = function(): void {
  if (repeatBoxEnabled === false) {
    const repeatPass = document.createElement('input');
    setAttributes(repeatPass, {
      'class': 'login',
      'id': 'repeatPassword',
      'autocomplete': 'new-password',
      'maxlength': '100',
      'placeholder': 'Repetă parola',
      'required': '',
      'tabindex': '3',
      'type': 'password',
    });

    const email = document.createElement('input');
    setAttributes(email, {
      'class': 'login',
      'id': 'email',
      'autocomplete': 'email',
      'maxlength': '254',
      'name': 'email',
      'placeholder': 'E-mail',
      'required': '',
      'tabindex': '4',
      'type': 'email',
      'spellcheck': 'false',
    });

    const chkLabel = document.createElement('label');
    setAttributes(chkLabel, {
      'class': 'checkbox-label',
      'id': 'chkLabel',
      'tabindex': '5',
    });
    chkLabel.textContent = 'Accept termenii și condițiile';

    const chkBox = document.createElement('input');
    setAttributes(chkBox, {
      'id': 'chkBox',
      'name': 'chkBox',
      'required': '',
      'type': 'checkbox',
    });

    const submitButton = document.getElementById('submitB') as HTMLInputElement;

    submitForm.insertBefore(repeatPass, submitButton);
    submitForm.insertBefore(email, submitButton);
    submitForm.insertBefore(chkLabel, submitButton);
    chkLabel.insertAdjacentElement('afterbegin', chkBox);

    setAttributes(passBox, { 'autocomplete': 'new-password' });

    lText.textContent = 'Creare cont';
    createAcc.textContent = 'Ai cont? Loghează-te!';

    repeatBox = document.getElementById('repeatPassword') as HTMLInputElement;
    emailBox = document.getElementById('email') as HTMLInputElement;
    checkLabel = document.getElementById('chkLabel') as HTMLLabelElement;

    repeatBox.onkeyup = repeatBoxKeyUp;
    emailBox.onkeyup = emailBoxKeyUp;
    emailBox.onblur = emailBoxBlur;
    emailBox.onkeydown = emailBoxKeyDown;

    repeatBoxEnabled = true;
    userBoxBlur();
  } else {
    removeCreateUser();
  }
};

userBox.onkeyup = userBoxKeyUp;
userBox.onblur = userBoxBlur;
userBox.onkeydown = userBoxKeyDown;
passBox.onkeyup = passBoxKeyUp;

// EventHandler functions

function userBoxKeyUp(): void {
  if (userRegexp.test(userBox.value) === true) {
    userBox.className = green;
  } else {
    if (userBox.value.length !== 0) {
      userBox.className = red;
    } else {
      userBox.className = gray;
    }
  }
}

function userBoxKeyDown(event: KeyboardEvent): void {
  if (event.key === ' ') {
    event.preventDefault();
  }
}

function userBoxBlur(): void {
  if (repeatBoxEnabled) {
    if (userBox.className === green) {
      request('POST', '/usernameExists', { 'username': userBox.value })
        .then(response => {
          if (response['response'] === true) {
            userBox.className = red;
          }
        })
        .catch(error => {
          userBox.className = red;
          if (error.message === '502') {
            snackbar('Nu s-a putut realiza conexiunea la server. Încearcă mai târziu!', 'red');
          } else {
            snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
          }
        });
    }
  } else {
    userBoxKeyUp();
  }
}

function passBoxKeyUp(): void {
  if (passwordCheck(passBox.value) === true) {
    passBox.className = green;
    if (repeatBoxEnabled === true) {
      repeatBoxKeyUp();
    }
  } else {
    if (passBox.value.length !== 0) {
      passBox.className = red;
    } else {
      passBox.className = gray;
      if (repeatBoxEnabled === true) {
        repeatBoxKeyUp();
      }
    }
  }
}

function repeatBoxKeyUp(): void {
  if (passBox.className === green) {
    if (passBox.value === repeatBox.value) {
      repeatBox.className = green;
    } else {
      repeatBox.className = red;
    }
  } else {
    repeatBox.className = gray;
  }
}

function emailBoxKeyUp(): void {
  if (emailRegexp.test(emailBox.value) === true) {
    emailBox.className = green;
  } else {
    if (emailBox.value.length !== 0) {
      emailBox.className = red;
    } else {
      emailBox.className = gray;
    }
  }
}

function emailBoxBlur(): void {
  if (emailBox.className === green) {
    request('POST', '/emailExists', { 'email': emailBox.value })
      .then(response => {
        if (response['response'] === true) {
          emailBox.className = red;
        }
      })
      .catch(error => {
        emailBox.className = red;
        if (error.message === '502') {
          snackbar('Nu s-a putut realiza conexiunea la server. Încearcă mai târziu!', 'red');
        } else {
          snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
        }
      });
  }
}

function emailBoxKeyDown(event: KeyboardEvent): void {
  if (event.key === ' ') {
    event.preventDefault();
  }
}

submitForm.addEventListener('submit', function(event) {
  if (userBox.className === green) {
    if (passBox.className === green) {
      if (repeatBoxEnabled === true) {
        if (repeatBox.className === green) {
          if (emailBox.className === green) {
            request('POST', '/signup', {
              'username': userBox.value,
              'password': passBox.value,
              'email': emailBox.value,
              'policy': (document.getElementById('chkBox') as HTMLInputElement).checked,
            })
              .then(response => {
                if (response['response'] === true) {
                  removeCreateUser();
                  submitForm.reset();
                  userBox.className = gray;
                  passBox.className = gray;
                  snackbar('Cont creat cu succes!', 'green');
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
                  }
                }
              })
              .catch(error => {
                switch (error.message) {
                  case '502':
                    snackbar('Nu s-a putut realiza conexiunea la server. Încearcă mai târziu!', 'red');
                    break;
                  default:
                    snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
                }
              });
          } else {
            if (emailRegexp.test(emailBox.value) === true) {
              snackbar('Adresa e-mail există deja!', 'red');
            } else {
              snackbar('Adresa e-mail nu este validă!', 'red');
            }
          }
        } else {
          if (repeatBox.value !== passBox.value) {
            snackbar('Parolele trebuie să fie identice!', 'red');
          }
        }
      } else {
        request('POST', '/signin', {
          'username': userBox.value,
          'password': passBox.value,
        })
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
              }, 3000);
            } else {
              switch (response['error']) {
                case 'username or password not found':
                  snackbar('Numele de utilizator sau parola sunt incorecte!', 'red');
                  break;
                case 'user disabled':
                  snackbar('Contul este dezactivat. Verifică adresa de e-mail înregistrată pentru activare!', 'blue');
                  break;
              }
            }
          })
          .catch(error => {
            switch (error.message) {
              case '502':
                snackbar('Nu s-a putut realiza conexiunea la server. Încearcă mai târziu!', 'red');
                break;
              default:
                snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
            }
          });
      }
    } else {
      const check = passwordCheck(passBox.value);
      if (check !== true) {
        if (check[0] === false) {
          snackbar('Parola trebuie să conțină minim 8 caractere!', 'red');
        } else {
          let errorMessage = 'Parola trebuie să conțină cel puțin:\n';
          if (!check[1]) errorMessage += '- un caracter majuscul\n';
          if (!check[2]) errorMessage += '- un caracter minuscul\n';
          if (!check[3]) errorMessage += '- o cifră\n';
          if (!check[4]) errorMessage += '- un caracter special\n';
          snackbar(errorMessage, 'red');
        }
      }
    }
  } else {
    if (userRegexp.test(userBox.value) === true) {
      if (repeatBoxEnabled === true) {
        snackbar('Numele de utilizator există deja!', 'red');
      }
    } else {
      snackbar(
        'Numele de utilizator trebuie să conțină minim 6 caractere și să înceapă cu un caracter alfanumeric. ' +
        'Simbolurile acceptate sunt: !?$^&*._-', 'red');
    }
  }
  event.preventDefault();
});

/**
 * Checks if the password requirements are met
 * @param password The password
 * @returns True if password is valid, boolean array with all check results otherwise
 */
function passwordCheck(password: string): true | boolean[] {
  let length = false;
  let uppercase = false;
  let lowercase = false;
  let digit = false;
  let special = false;
  if (password.length >= MIN_PASSWORD_LENGTH) {
    length = true;
    for (let i = 0; i < password.length; i++) {
      const c = password.charAt(i);
      if (uppercase === true && lowercase === true && digit === true && special === true) {
        return true;
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
    return true;
  }
  return [length, uppercase, lowercase, digit, special];
}

/**
 * Removes the inputs used for creating an account
 */
function removeCreateUser(): void {
  submitForm.removeChild(repeatBox);
  submitForm.removeChild(emailBox);
  submitForm.removeChild(checkLabel);

  repeatBoxEnabled = false;

  setAttributes(passBox, { 'autocomplete': 'current-password' });

  lText.textContent = 'Login';
  createAcc.textContent = 'Nu ai cont? Creează unul!';

  userBoxBlur();
}
