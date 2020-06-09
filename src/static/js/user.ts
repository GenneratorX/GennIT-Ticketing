'use strict';

let editUserInfoButton: HTMLImageElement;
let addFriendButton: HTMLImageElement;

const nameRegexp = /^([a-z\u00C0-\u02AB]+((['´`,. -][a-z\u00C0-\u02AB ])?[a-z\u00C0-\u02AB]*)*){2,50}$/i;
const phoneNumberRegexp = /^[0-9]{9,15}$/;

if (window.sessionStorage.getItem('userId') === window.location.pathname.substring(6)) {
  displayEditUserInfoButton();
  displayAddFriendButton();
}

/**
 * Displays the edit user information button
 */
function displayEditUserInfoButton() {
  editUserInfoButton = document.createElement('img');
  setAttributes(editUserInfoButton, {
    'class': 'box-title-edit',
    'src': 'https://static.gennerator.com/img/svg/edit.svg',
    'alt': 'Editare informații utilizator',
  });
  (document.getElementById('userInfo') as HTMLDivElement).appendChild(editUserInfoButton);

  editUserInfoButton.onclick = displayEditUserInfo;
}

/**
 * Displays the add friend button
 */
function displayAddFriendButton() {
  addFriendButton = document.createElement('img');
  setAttributes(addFriendButton, {
    'class': 'box-title-edit',
    'src': 'https://static.gennerator.com/img/svg/user-add.svg',
    'alt': 'Adăugare prieten',
  });
  (document.getElementById('userFriends') as HTMLDivElement).appendChild(addFriendButton);

  addFriendButton.onclick = displayAddFriend;
}

/**
 * Displays the user information edit window
 */
function displayEditUserInfo() {
  request('GET', `/user/${window.sessionStorage.getItem('userId')}/info`)
    .then(response => {
      if (response['error'] === undefined) {
        removeUserInfoDisplay();
        const userInfoDiv = document.getElementById('userInfoDiv') as HTMLDivElement;
        const form = document.createElement('form');
        setAttributes(form, {
          'id': 'edit-user-info',
          'class': 'edit-user-info',
          'spellcheck': 'false',
        });

        /**
         * First name input
         */
        const firstNameInput = document.createElement('input');
        setAttributes(firstNameInput, {
          'autocomplete': 'given-name',
          'id': 'firstName',
          'maxlength': '50',
          'placeholder': 'Prenume',
        });

        /**
         * Last name input
         */
        const lastNameInput = document.createElement('input');
        setAttributes(lastNameInput, {
          'autocomplete': 'family-name',
          'id': 'lastName',
          'maxlength': '50',
          'placeholder': 'Nume',
        });

        /**
         * Email input
         */
        const emailInput = document.createElement('input');
        setAttributes(emailInput, {
          'autocomplete': 'email',
          'disabled': '',
          'id': 'email',
          'maxlength': '254',
          'type': 'email',
        });

        /**
         * Birth day input
         */
        const birthDateDayInput = document.createElement('input');
        setAttributes(birthDateDayInput, {
          'autocomplete': 'bday-day',
          'id': 'birthDateDay',
          'maxlength': '2',
          'placeholder': 'Zi',
        });

        /**
         * Birth month input
         */
        const birthDateMonthInput = document.createElement('select');
        setAttributes(birthDateMonthInput, {
          'id': 'birthDateMonth',
        });
        const defaultBirthDateMonthValue = new Option('Luna', '');
        setAttributes(defaultBirthDateMonthValue, {
          'selected': '',
        });
        birthDateMonthInput.add(defaultBirthDateMonthValue);
        const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie',
          'Octombrie', 'Noiembrie', 'Decembrie'];
        for (let i = 0; i < months.length; i++) {
          birthDateMonthInput.add(new Option(months[i], (i + 1).toString().padStart(2, '0')));
        }

        /**
         * Birth year input
         */
        const birthDateYearInput = document.createElement('input');
        setAttributes(birthDateYearInput, {
          'autocomplete': 'bday-year',
          'id': 'birthDateYear',
          'maxlength': '4',
          'placeholder': 'An',
        });

        /**
         * Gender input
         */
        const genderInput = document.createElement('select');
        setAttributes(genderInput, {
          'id': 'gender',
        });
        const defaultGenderValue = new Option('Sex', '');
        setAttributes(defaultGenderValue, {
          'disabled': '',
          'hidden': '',
          'selected': '',
        });
        genderInput.add(defaultGenderValue);
        genderInput.add(new Option('Masculin', '0'));
        genderInput.add(new Option('Feminin', '1'));
        genderInput.add(new Option('Nespecificat', '2'));

        /**
         * Phone number input
         */
        const phoneNumberInput = document.createElement('input');
        setAttributes(phoneNumberInput, {
          'autocomplete': 'tel',
          'id': 'phoneNumber',
          'maxlength': '15',
          'type': 'tel',
          'placeholder': 'Număr de telefon',
        });

        /**
         * Submit button
         */
        const submitButton = document.createElement('input');
        setAttributes(submitButton, {
          'id': 'submitButton',
          'type': 'submit',
        });

        /**
         * Add user info to inputs
         */
        firstNameInput.value = response['userInfo']['firstName'];
        lastNameInput.value = response['userInfo']['lastName'];
        emailInput.value = response['userInfo']['email'];
        if (response['userInfo']['birth_date'] !== null) {
          const birthDate = new Date(response['userInfo']['birthDate']);
          birthDateDayInput.value = birthDate.getDate().toString();
          birthDateMonthInput.selectedIndex = birthDate.getMonth() + 1;
          birthDateYearInput.value = birthDate.getFullYear().toString();
        }
        if (response['userInfo']['gender'] !== null) {
          genderInput.selectedIndex = parseInt(response['userInfo']['gender']) + 1;
        }
        phoneNumberInput.value = response['userInfo']['phoneNumber'];
        submitButton.value = 'SALVEAZĂ';

        /**
         * Add event handlers
         */
        firstNameInput.onkeyup = onKeyUpFirstNameInput;
        firstNameInput.onblur = onBlurFirstNameInput;
        lastNameInput.onkeyup = onKeyUpLastNameInput;
        lastNameInput.onblur = onBlurLastNameInput;
        birthDateDayInput.onkeyup = onKeyUpBirthDateDayInput;
        birthDateDayInput.onkeydown = inputAllowOnlyNumbers;
        birthDateDayInput.onblur = onBlurDate;
        birthDateMonthInput.onchange = onBlurDate;
        birthDateYearInput.onkeyup = onKeyUpBirthDateYearInput;
        birthDateYearInput.onkeydown = inputAllowOnlyNumbers;
        birthDateYearInput.onblur = onBlurDate;
        phoneNumberInput.onkeyup = onKeyUpPhoneNumberInput;
        phoneNumberInput.onkeydown = inputAllowOnlyNumbers;

        submitButton.onclick = event => {
          onClickSubmitButton(event, {
            'email': response['userInfo']['email'],
            'createDate': response['userInfo']['createDate'],
            'lastLogin': response['userInfo']['lastLogin'],
          });
        };

        /**
         * Add inputs to window
         */
        userInfoDiv.appendChild(form);
        form.appendChild(firstNameInput);
        form.appendChild(lastNameInput);
        form.appendChild(emailInput);
        form.appendChild(birthDateDayInput);
        form.appendChild(birthDateMonthInput);
        form.appendChild(birthDateYearInput);
        form.appendChild(genderInput);
        form.appendChild(phoneNumberInput);
        form.appendChild(submitButton);
      } else {
        snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
      }
    })
    .catch(() => {
      snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
    });
}

/**
 * Displays the add friend window
 */
function displayAddFriend() {

}

/**
 * Removes the user information from the window
 */
function removeUserInfoDisplay() {
  (document.getElementById('userInfo') as HTMLDivElement).removeChild(editUserInfoButton);
  const userInfoDiv = document.getElementById('userInfoDiv') as HTMLDivElement;
  while (userInfoDiv.childNodes.length > 1) {
    userInfoDiv.removeChild(userInfoDiv.lastChild as ChildNode);
  }
}

/**
 * Displays the user information window
 * @param userInfo User information object
 */
function displayUserInfo(
  userInfo: {
    firstName: string | null,
    lastName: string | null,
    birthDate: string | null,
    gender: string | null,
    phoneNumber: string | null,
    email: string,
    createDate: string,
    lastLogin: string
  }
) {
  const userInfoDiv = document.getElementById('userInfoDiv') as HTMLDivElement;
  const form = document.getElementById('edit-user-info') as HTMLFormElement;
  userInfoDiv.removeChild(form);
  displayEditUserInfoButton();

  displayUserInfoSection('Prenume', userInfo.firstName);
  displayUserInfoSection('Nume', userInfo.lastName);
  if (userInfo.birthDate !== null) {
    displayUserInfoSection('Data nașterii', new Date(userInfo.birthDate).toLocaleDateString('ro-RO'));
  }
  switch (userInfo.gender) {
    case '0': displayUserInfoSection('Sex', 'Masculin'); break;
    case '1': displayUserInfoSection('Sex', 'Feminin'); break;
    case '2': displayUserInfoSection('Sex', 'Nespecificat'); break;
  }
  displayUserInfoSection('Număr telefon', userInfo.phoneNumber);
  displayUserInfoSection('Adresă e-mail', userInfo.email);
  displayUserInfoSection('Cont creat', new Date(userInfo.createDate).toLocaleString('ro-RO'));
  displayUserInfoSection('Văzut ultima dată', new Date(userInfo.lastLogin).toLocaleString('ro-RO'));
}

/**
 * Adds an information section to the user info window
 * @param name Name of the element
 * @param value Value of the element
 */
function displayUserInfoSection(name: string, value: string | null) {
  if (value !== null) {
    const userInfoDiv = document.getElementById('userInfoDiv') as HTMLDivElement;

    const div = document.createElement('div');
    div.textContent = value;
    const span = document.createElement('span');
    span.className = 'bold';
    span.textContent = `${name}: `;
    div.insertAdjacentElement('afterbegin', span);

    userInfoDiv.appendChild(div);
  }
}


/**
 * Event handlers
 */

function onKeyUpFirstNameInput() {
  const firstNameInput = document.getElementById('firstName') as HTMLInputElement;
  if (firstNameInput.value.length > 0) {
    if (nameRegexp.test(firstNameInput.value) === true) {
      setBorderColor(firstNameInput, 'green');
    } else {
      setBorderColor(firstNameInput, 'red');
    }
  } else {
    setBorderColor(firstNameInput);
  }
}

function onBlurFirstNameInput() {
  const firstNameInput = document.getElementById('firstName') as HTMLInputElement;
  firstNameInput.value = trimWhitespace(firstNameInput.value);
  onKeyUpFirstNameInput();
}

function onKeyUpLastNameInput() {
  const lastNameInput = document.getElementById('lastName') as HTMLInputElement;
  if (lastNameInput.value.length > 0) {
    if (nameRegexp.test(lastNameInput.value) === true) {
      setBorderColor(lastNameInput, 'green');
    } else {
      setBorderColor(lastNameInput, 'red');
    }
  } else {
    setBorderColor(lastNameInput);
  }
}

function onBlurLastNameInput() {
  const lastNameInput = document.getElementById('lastName') as HTMLInputElement;
  lastNameInput.value = trimWhitespace(lastNameInput.value);
  onKeyUpLastNameInput();
}

function onBlurDate() {
  const birthDateDayInput = document.getElementById('birthDateDay') as HTMLInputElement;
  const birthDateMonthInput = document.getElementById('birthDateMonth') as HTMLSelectElement;
  const birthDateYearInput = document.getElementById('birthDateYear') as HTMLInputElement;
  if (
    birthDateDayInput.value.length > 0 ||
    birthDateMonthInput.selectedIndex !== 0 ||
    birthDateYearInput.value.length > 0
  ) {
    if (
      isDate(
        `${birthDateYearInput.value}-` +
        `${birthDateMonthInput.value}-` +
        `${birthDateDayInput.value.padStart(2, '0')}`
      ) === true &&
      new Date(
        `${birthDateYearInput.value}-` +
        `${birthDateMonthInput.value}-` +
        `${birthDateDayInput.value.padStart(2, '0')}`
      ) < new Date()
    ) {
      setBorderColor(birthDateDayInput, 'green');
      setBorderColor(birthDateMonthInput, 'green');
      setBorderColor(birthDateYearInput, 'green');
    } else {
      setBorderColor(birthDateDayInput, 'red');
      setBorderColor(birthDateMonthInput, 'red');
      setBorderColor(birthDateYearInput, 'red');
    }
  } else {
    setBorderColor(birthDateDayInput);
    setBorderColor(birthDateMonthInput);
    setBorderColor(birthDateYearInput);
  }
}

function onKeyUpBirthDateDayInput() {
  const birthDateDayInput = document.getElementById('birthDateDay') as HTMLInputElement;
  if (birthDateDayInput.value.length > 0) {
    const inputValue = parseInt(birthDateDayInput.value);
    if (isNaN(inputValue) === false) {
      if (inputValue >= 1 && inputValue <= 31) {
        setBorderColor(birthDateDayInput);
      } else {
        setBorderColor(birthDateDayInput, 'red');
      }
    } else {
      setBorderColor(birthDateDayInput, 'red');
    }
  } else {
    setBorderColor(birthDateDayInput);
  }
  onBlurDate();
}

function onKeyUpBirthDateYearInput() {
  const birthDateYearInput = document.getElementById('birthDateYear') as HTMLInputElement;
  if (birthDateYearInput.value.length > 0) {
    const inputValue = parseInt(birthDateYearInput.value);
    if (isNaN(inputValue) === false) {
      if (inputValue >= 1900 && inputValue <= new Date().getFullYear()) {
        setBorderColor(birthDateYearInput);
      } else {
        setBorderColor(birthDateYearInput, 'red');
      }
    } else {
      setBorderColor(birthDateYearInput, 'red');
    }
  } else {
    setBorderColor(birthDateYearInput);
  }
  onBlurDate();
}

function onKeyUpPhoneNumberInput() {
  const phoneNumberInput = document.getElementById('phoneNumber') as HTMLInputElement;
  if (phoneNumberInput.value.length > 0) {
    if (phoneNumberRegexp.test(phoneNumberInput.value) === true) {
      setBorderColor(phoneNumberInput, 'green');
    } else {
      setBorderColor(phoneNumberInput, 'red');
    }
  } else {
    setBorderColor(phoneNumberInput);
  }
}

/**
 * Submit button click event handler
 * @param event Mouse event
 * @param info User information
 */
function onClickSubmitButton(event: MouseEvent, info: { [property: string]: string }) {
  const userInfo: { [property: string]: string | null } = {};

  const firstNameInput = document.getElementById('firstName') as HTMLInputElement;
  const lastNameInput = document.getElementById('lastName') as HTMLInputElement;
  const birthDateDayInput = document.getElementById('birthDateDay') as HTMLInputElement;
  const birthDateMonthInput = document.getElementById('birthDateMonth') as HTMLSelectElement;
  const birthDateYearInput = document.getElementById('birthDateYear') as HTMLInputElement;
  const genderInput = document.getElementById('gender') as HTMLSelectElement;
  const phoneNumberInput = document.getElementById('phoneNumber') as HTMLInputElement;

  if (
    firstNameInput.className !== 'red' &&
    lastNameInput.className !== 'red' &&
    birthDateDayInput.className !== 'red' &&
    birthDateMonthInput.className !== 'red' &&
    birthDateYearInput.className !== 'red' &&
    phoneNumberInput.className !== 'red'
  ) {
    /**
     * Add first name to user info
     */
    userInfo['firstName'] = firstNameInput.value !== '' ? firstNameInput.value : null;

    /**
     * Add last name to user info
     */
    userInfo['lastName'] = lastNameInput.value !== '' ? lastNameInput.value : null;

    /**
     * Add birthdate to user info
     */
    if (
      birthDateDayInput.className === 'green' &&
      birthDateMonthInput.className === 'green' &&
      birthDateYearInput.className === 'green'
    ) {
      userInfo['birthDate'] =
        `${birthDateYearInput.value}-` +
        `${birthDateMonthInput.value}-` +
        `${birthDateDayInput.value.padStart(2, '0')}`;
    } else {
      if (
        birthDateDayInput.value.length > 0 &&
        birthDateMonthInput.selectedIndex !== 0 &&
        birthDateYearInput.value.length > 0
      ) {
        userInfo['birthDate'] =
          `${birthDateYearInput.value}-${birthDateMonthInput.value}-${birthDateDayInput.value.padStart(2, '0')}`;
      } else {
        userInfo['birthDate'] = null;
      }
    }

    /**
     * Add gender to user info
     */
    userInfo['gender'] = genderInput.value !== '' ? genderInput.value : null;

    /**
     * Add phone number to user info
     */
    userInfo['phoneNumber'] = phoneNumberInput.value !== '' ? phoneNumberInput.value : null;

    request('PUT', `/user/${window.sessionStorage.getItem('userId')}/info`, userInfo)
      .then(response => {
        if (response['status'] === 'success') {
          snackbar('Datele utilizatorului au fost schimbate!', 'green');
          displayUserInfo({
            firstName: userInfo['firstName'],
            lastName: userInfo['lastName'],
            birthDate: userInfo['birthDate'],
            gender: userInfo['gender'],
            phoneNumber: userInfo['phoneNumber'],
            email: info['email'],
            createDate: info['createDate'],
            lastLogin: info['lastLogin'],
          });
        } else {
          snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
        }
      })
      .catch(() => {
        snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
      });
  } else {
    snackbar('Datele introduse sunt invalide. Verifică datele introduse în câmpurile roșii!', 'red');
  }
  event.preventDefault();
}
