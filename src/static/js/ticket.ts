'use strict';

const newTicketButton = document.getElementById('newTicket') as HTMLImageElement;

let startDateInput: flatpickr;
let endDateInput: flatpickr;

newTicketButton.onclick = () => {
  const ticketsDiv = document.getElementById('tickets') as HTMLDivElement;
  const filtersDiv = document.getElementById('filters') as HTMLDivElement;

  /**
   * Hide all tickets and filters
   */
  for (let i = 0; i < ticketsDiv.children.length; i++) {
    ticketsDiv.children[i].classList.add('hidden');
  }

  /**
   * Remove all filters
   */
  while (filtersDiv.children.length > 1) {
    filtersDiv.removeChild(filtersDiv.lastChild as ChildNode);
  }

  ticketsDiv.classList.add('gray-bg');

  /**
   * Create form
   */
  const newTicketForm = document.createElement('form');
  newTicketForm.id = 'ticketForm';

  /**
   * Add elements to form
   */
  const ticketTitle = document.createElement('div');
  ticketTitle.className = 'new-ticket-title';
  ticketTitle.textContent = 'Adăugare incident';

  const ticketTitleInput = document.createElement('input');
  setAttributes(ticketTitleInput, {
    'id': 'ticketTitle',
    'maxlength': '100',
    'placeholder': 'Subiect incident',
    'required': '',
  });

  const ticketMessageInput = document.createElement('textarea');
  setAttributes(ticketMessageInput, {
    'id': 'ticketMessage',
    'maxlength': '2000',
    'placeholder': 'Descriere incident',
    'wrap': 'soft',
    'required': '',
  });

  const ticketSubmitButton = document.createElement('input');
  setAttributes(ticketSubmitButton, {
    'id': 'submitButton',
    'type': 'submit',
    'value': 'Adaugă tichet',
  });

  /**
   * Add ticket parameters
   */
  const newTicketParametersTitle = document.createElement('div');
  newTicketParametersTitle.className = 'new-ticket-title';
  newTicketParametersTitle.textContent = 'Parametrii incident';

  // Add requestor filed
  const requestorTitle = document.createElement('div');
  requestorTitle.className = 'parameter-title';
  requestorTitle.textContent = 'Solicitant';

  const requestor = document.createElement('div');
  requestor.className = 'requestor';

  const requestorProfilePicture = document.createElement('div');
  requestorProfilePicture.className = 'profile-picture';

  const requestorName = document.createElement('span');
  requestorName.className = 'profile-name';

  requestor.appendChild(requestorProfilePicture);
  requestor.appendChild(requestorName);

  request('GET', `/user/userInfo?userId=${window.sessionStorage.getItem('userId')}`)
    .then(response => {
      if (response['error'] === undefined) {
        requestorProfilePicture.textContent = response['userInfo']['username'].charAt(0).toUpperCase();
        requestorName.textContent = response['userInfo']['username'];
      } else {
        snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
      }
    })
    .catch(() => {
      snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
    });

  // Add category field
  const categoryTitle = document.createElement('label');
  setAttributes(categoryTitle, {
    'class': 'parameter-title',
    'for': 'ticketCategory',
  });
  categoryTitle.textContent = 'Categorie*';

  const ticketCategoryInput = document.createElement('select');
  setAttributes(ticketCategoryInput, {
    'id': 'ticketCategory',
    'form': 'ticketForm',
    'required': '',
  });
  const defaultTicketCategory = new Option('Alege categoria', '0');
  setAttributes(defaultTicketCategory, {
    'disabled': '',
    'hidden': '',
    'selected': '',
  });
  ticketCategoryInput.add(defaultTicketCategory);
  ticketCategoryInput.add(new Option('IT', '1'));
  ticketCategoryInput.add(new Option('Dezvoltare software', '2'));
  ticketCategoryInput.add(new Option('Operațiuni', '3'));
  ticketCategoryInput.add(new Option('Marketing', '4'));
  ticketCategoryInput.add(new Option('Resurse umane', '5'));

  // Add priority field
  const priorityTitle = document.createElement('label');
  setAttributes(priorityTitle, {
    'class': 'parameter-title',
    'for': 'ticketPriority',
  });
  priorityTitle.textContent = 'Prioritate*';

  const ticketPriorityInput = document.createElement('select');
  setAttributes(ticketPriorityInput, {
    'id': 'ticketPriority',
    'form': 'ticketForm',
    'required': '',
  });
  const defaultTicketPriority = new Option('Alege prioritatea', '0');
  setAttributes(defaultTicketPriority, {
    'disabled': '',
    'hidden': '',
    'selected': '',
  });
  ticketPriorityInput.add(defaultTicketPriority);
  ticketPriorityInput.add(new Option('Scăzut', '1'));
  ticketPriorityInput.add(new Option('Mediu', '2'));
  ticketPriorityInput.add(new Option('Ridicat', '3'));
  ticketPriorityInput.add(new Option('Urgent', '4'));

  // Add assignee
  const assigneeTitle = document.createElement('label');
  setAttributes(assigneeTitle, {
    'class': 'parameter-title',
    'for': 'ticketAssignee',
  });
  assigneeTitle.textContent = 'Reprezentant';

  const ticketAssigneeInput = document.createElement('select');
  setAttributes(ticketAssigneeInput, {
    'id': 'ticketAssignee',
    'form': 'ticketForm',
  });
  const defaultTicketAssignee = new Option('Alege reprezentantul', '0', true);
  ticketAssigneeInput.add(defaultTicketAssignee);

  request('GET', '/user/list')
    .then(response => {
      if (response['error'] === undefined) {
        for (let i = 0; i < response['userList'].length; i++) {
          ticketAssigneeInput.add(new Option(response['userList'][i]['userName'], response['userList'][i]['userId']));
        }
      } else {
        snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
      }
    })
    .catch(() => {
      snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
    });

  // Add start date
  const startDateTitle = document.createElement('label');
  setAttributes(startDateTitle, {
    'class': 'parameter-title',
    'for': 'ticketStartDate',
  });
  startDateTitle.textContent = 'Dată inițială*';

  const ticketStartDateInput = document.createElement('input');
  setAttributes(ticketStartDateInput, {
    'id': 'ticketStartDate',
    'form': 'ticketForm',
    'placeholder': 'Data inițială',
    'required': '',
  });

  startDateInput = flatpickr(ticketStartDateInput, {
    'locale': 'ro',
    'disableMobile': true,
    'enableTime': true,
    'defaultDate': new Date(),
    'minDate': new Date(),
    'dateFormat': 'd/m/Y, H:i',
  });

  // Add end date
  const endDateTitle = document.createElement('label');
  setAttributes(endDateTitle, {
    'class': 'parameter-title',
    'for': 'ticketEndDate',
  });
  endDateTitle.textContent = 'Dată finală';

  const ticketEndDateInput = document.createElement('input');
  setAttributes(ticketEndDateInput, {
    'id': 'ticketEndDate',
    'form': 'ticketForm',
    'placeholder': 'Data finală',
  });

  endDateInput = flatpickr(ticketEndDateInput, {
    'locale': 'ro',
    'disableMobile': true,
    'enableTime': true,
    'minDate': flatpickr.parseDate(ticketStartDateInput.value, 'd/m/Y, H:i'),
    'dateFormat': 'd/m/Y, H:i',
  });

  // Add ticket status
  const statusTitle = document.createElement('label');
  setAttributes(statusTitle, {
    'class': 'parameter-title',
    'for': 'ticketStatusTitle',
  });
  statusTitle.textContent = 'Statut tichet*';

  const ticketStatusInput = document.createElement('select');
  setAttributes(ticketStatusInput, {
    'id': 'ticketStatus',
    'form': 'ticketForm',
    'required': '',
  });
  const defaultTicketStatus = new Option('Alege statutul', '0');
  setAttributes(defaultTicketStatus, {
    'disabled': '',
    'hidden': '',
    'selected': '',
  });
  ticketStatusInput.add(defaultTicketStatus);
  ticketStatusInput.add(new Option('Nou', '1'));
  ticketStatusInput.add(new Option('Soluționat', '2'));

  /**
   * Add event handlers
   */
  ticketTitleInput.onkeyup = onKeyUpTicketTitleInput;
  ticketTitleInput.onblur = onBlurTicketTitleInput;
  ticketMessageInput.onkeyup = onKeyUpTicketMessageInput;
  ticketMessageInput.onblur = onBlurTicketMessageInput;
  ticketCategoryInput.onchange = onSelectionChangeTicketCategoryInput;
  ticketPriorityInput.onchange = onSelectionChangeTicketPriorityInput;
  ticketStatusInput.onchange = onSelectionChangeTicketStatusInput;
  ticketStartDateInput.onchange = onChangeTicketStartDateInput;
  ticketSubmitButton.onclick = onClickTicketSubmitButton;

  /**
   * Add elements to ticket parameters
   */
  filtersDiv.appendChild(newTicketParametersTitle);
  filtersDiv.appendChild(requestorTitle);
  filtersDiv.appendChild(requestor);
  filtersDiv.appendChild(categoryTitle);
  filtersDiv.appendChild(ticketCategoryInput);
  filtersDiv.appendChild(priorityTitle);
  filtersDiv.appendChild(ticketPriorityInput);
  filtersDiv.appendChild(assigneeTitle);
  filtersDiv.appendChild(ticketAssigneeInput);
  filtersDiv.appendChild(startDateTitle);
  filtersDiv.appendChild(ticketStartDateInput);
  filtersDiv.appendChild(endDateTitle);
  filtersDiv.appendChild(ticketEndDateInput);
  filtersDiv.appendChild(statusTitle);
  filtersDiv.appendChild(ticketStatusInput);

  /**
   * Add elements to visible form
   */
  newTicketForm.appendChild(ticketTitle);
  newTicketForm.appendChild(ticketTitleInput);
  newTicketForm.appendChild(ticketMessageInput);
  newTicketForm.appendChild(ticketSubmitButton);

  ticketsDiv.insertAdjacentElement('afterbegin', newTicketForm);
};


/**
 * Event handlers
 */

function onKeyUpTicketTitleInput() {
  const ticketTitleInput = document.getElementById('ticketTitle') as HTMLInputElement;
  if (ticketTitleInput.value.length > 9) {
    setBorderColor(ticketTitleInput, 'green');
  } else {
    if (ticketTitleInput.value.length !== 0) {
      setBorderColor(ticketTitleInput, 'red');
    } else {
      setBorderColor(ticketTitleInput);
    }
  }
}

function onBlurTicketTitleInput() {
  const ticketTitleInput = document.getElementById('ticketTitle') as HTMLInputElement;
  ticketTitleInput.value = trimWhitespace(ticketTitleInput.value);
}

function onKeyUpTicketMessageInput() {
  const ticketMessageInput = document.getElementById('ticketMessage') as HTMLInputElement;
  if (ticketMessageInput.value.length > 19) {
    setBorderColor(ticketMessageInput, 'green');
  } else {
    if (ticketMessageInput.value.length !== 0) {
      setBorderColor(ticketMessageInput, 'red');
    } else {
      setBorderColor(ticketMessageInput);
    }
  }
}

function onBlurTicketMessageInput() {
  const ticketMessageInput = document.getElementById('ticketMessage') as HTMLTextAreaElement;
  ticketMessageInput.value = trimWhitespace(ticketMessageInput.value);
}

function onChangeTicketStartDateInput() {
  endDateInput.set('minDate', startDateInput['latestSelectedDateObj']);
}

function onSelectionChangeTicketCategoryInput() {
  const ticketCategoryInput = document.getElementById('ticketCategory') as HTMLSelectElement;
  setBorderColor(ticketCategoryInput, 'green');
}

function onSelectionChangeTicketPriorityInput() {
  const ticketPriorityInput = document.getElementById('ticketPriority') as HTMLSelectElement;
  setBorderColor(ticketPriorityInput, 'green');
}

function onSelectionChangeTicketStatusInput() {
  const ticketStatusInput = document.getElementById('ticketStatus') as HTMLSelectElement;
  setBorderColor(ticketStatusInput, 'green');
}


function onClickTicketSubmitButton(event: MouseEvent) {
  const ticketTitleInput = document.getElementById('ticketTitle') as HTMLInputElement;
  const ticketMessageInput = document.getElementById('ticketMessage') as HTMLInputElement;
  const ticketCategoryInput = document.getElementById('ticketCategory') as HTMLSelectElement;
  const ticketPriorityInput = document.getElementById('ticketPriority') as HTMLSelectElement;
  const ticketAssigneeInput = document.getElementById('ticketAssignee') as HTMLSelectElement;
  const ticketEndDateInput = document.getElementById('ticketEndDate') as HTMLInputElement;
  const ticketStatusInput = document.getElementById('ticketStatus') as HTMLSelectElement;

  if (ticketTitleInput.value.length < 10) {
    setBorderColor(ticketTitleInput, 'red');
  }

  if (ticketMessageInput.value.length < 20) {
    setBorderColor(ticketMessageInput, 'red');
  }

  if (ticketCategoryInput.selectedIndex === 0) {
    setBorderColor(ticketCategoryInput, 'red');
  }

  if (ticketPriorityInput.selectedIndex === 0) {
    setBorderColor(ticketPriorityInput, 'red');
  }

  if (ticketStatusInput.selectedIndex === 0) {
    setBorderColor(ticketStatusInput, 'red');
  }

  if (
    ticketTitleInput.className !== 'red' &&
    ticketMessageInput.className !== 'red' &&
    ticketCategoryInput.className !== 'red' &&
    ticketPriorityInput.className !== 'red' &&
    ticketStatusInput.className !== 'red'
  ) {
    request('POST', '/ticket/add', {
      'title': ticketTitleInput.value,
      'message': ticketMessageInput.value,
      'category': ticketCategoryInput.value,
      'priority': ticketPriorityInput.value,
      'assignee': ticketAssigneeInput.selectedIndex === 0 ? null : ticketAssigneeInput.value,
      'startDate': startDateInput['latestSelectedDateObj'],
      'endDate': ticketEndDateInput.value.length === 0 ? null : endDateInput['latestSelectedDateObj'],
      'status': ticketStatusInput.value,
    })
      .then(response => {
        if (response['status'] === 'success') {
          snackbar('Tichetul a fost creat cu success!', 'green');
          setTimeout(function() {
            window.location.href = `/ticket/${response['ticketId']}`;
          }, 1000);
        } else {
          snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
        }
      })
      .catch(() => {
        snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
      });
  } else {
    snackbar('Verifică secțiunile marcate cu roșu!', 'red');
  }
  event.preventDefault();
}