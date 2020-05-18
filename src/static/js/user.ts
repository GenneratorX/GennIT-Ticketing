'use strict';

let editUserInfoButton: HTMLImageElement;
let addFriendButton: HTMLImageElement;

if (window.sessionStorage.getItem('userId') === window.location.pathname.substring(6)) {
  displayEditUserInfoButton();
  displayAddFriendButton();
}

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
  request('GET', `/userInfo?userId=${window.sessionStorage.getItem('userId')}`)
    .then(response => {
      if (response['error'] === undefined) {
        removeUserInfoDisplay();
        const userInfoDiv = document.getElementById('userInfoDiv') as HTMLDivElement;
        const form = document.createElement('form');
        setAttributes(form, {
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
          'disabled': '',
          'hidden': '',
          'selected': '',
        });
        birthDateMonthInput.add(defaultBirthDateMonthValue);
        const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie',
          'Octombrie', 'Noiembrie', 'Decembrie'];
        for (let i = 0; i < months.length; i++) {
          birthDateMonthInput.add(new Option(months[i], i.toString()));
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

        submitButton.onclick = event => {
          request('POST', '/updateUserInfo', {
            'userId': window.sessionStorage.getItem('userId'),
            'firstName': firstNameInput.value !== '' ? firstNameInput.value : null,
            'lastName': lastNameInput.value !== '' ? lastNameInput.value : null,
            'birthDate': `${birthDateYearInput.value}-${birthDateMonthInput.selectedIndex}-${birthDateDayInput.value}`,
            'gender': genderInput.value !== '' ? genderInput.value : null,
            'phoneNumber': phoneNumberInput.value !== '' ? phoneNumberInput.value : null,
          })
            .then(response2 => {
              if (response2['status'] === 'success') {
                snackbar('Datele utilizatorului au fost schimbate!', 'green');
                userInfoDiv.removeChild(form);
                displayEditUserInfoButton();
                displayUserInfo(
                  firstNameInput.value,
                  lastNameInput.value,
                  `${birthDateYearInput.value}-${birthDateMonthInput.selectedIndex}-${birthDateDayInput.value}`,
                  genderInput.value,
                  phoneNumberInput.value,
                  response['userInfo']['email'],
                  response['userInfo']['create_date'],
                  response['userInfo']['last_login']
                );
              } else {
                snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
              }
            })
            .catch(() => {
              snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
            });
          event.preventDefault();
        };

        /**
         * Add user info to inputs
         */
        firstNameInput.value = response['userInfo']['first_name'];
        lastNameInput.value = response['userInfo']['last_name'];
        emailInput.value = response['userInfo']['email'];
        if (response['userInfo']['birth_date'] !== null) {
          const birthDate = new Date(response['userInfo']['birth_date']);
          birthDateDayInput.value = birthDate.getDate().toString();
          birthDateMonthInput.selectedIndex = birthDate.getMonth() + 1;
          birthDateYearInput.value = birthDate.getFullYear().toString();
        }
        if (response['userInfo']['gender'] !== null) {
          genderInput.selectedIndex = parseInt(response['userInfo']['gender']) + 1;
        }
        phoneNumberInput.value = response['userInfo']['phone_number'];
        submitButton.value = 'SALVEAZĂ';

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
 * @param firstName First name
 * @param lastName Last name
 * @param birthDate Birth date
 * @param gender Gender
 * @param phoneNumber Phone number
 * @param email Email address
 * @param createDate Account creation date
 * @param lastLogin Account last login date
 */
function displayUserInfo(
  firstName: string,
  lastName: string,
  birthDate: string,
  gender: string,
  phoneNumber: string,
  email: string,
  createDate: string,
  lastLogin: string
) {
  displayUserInfoSection('Prenume', firstName);
  displayUserInfoSection('Nume', lastName);
  displayUserInfoSection('Data nașterii', new Date(birthDate).toLocaleDateString('ro-RO'));
  switch (gender) {
    case '0': displayUserInfoSection('Sex', 'Masculin'); break;
    case '1': displayUserInfoSection('Sex', 'Feminin'); break;
    case '2': displayUserInfoSection('Sex', 'Nespecificat'); break;
    default: displayUserInfoSection('Sex', gender);
  }
  displayUserInfoSection('Număr telefon', phoneNumber);
  displayUserInfoSection('Adresă e-mail', email);
  displayUserInfoSection('Cont creat', new Date(createDate).toLocaleString('ro-RO'));
  displayUserInfoSection('Văzut ultima dată', new Date(lastLogin).toLocaleString('ro-RO'));
}

/**
 * Adds an information section to the user info window
 * @param name Name of the element
 * @param value Value of the element
 */
function displayUserInfoSection(name: string, value: string) {
  if (value !== '') {
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
