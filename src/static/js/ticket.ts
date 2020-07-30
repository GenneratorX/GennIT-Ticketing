'use strict';

const newTicketButton = document.getElementById('newTicket') as HTMLImageElement;
const searchInput = document.getElementById('searchBox') as HTMLInputElement;

let startDateInput: flatpickr.Instance;
let endDateInput: flatpickr.Instance;

newTicketButton.onclick = () => {
  const ticketsDiv = document.getElementById('tickets') as HTMLDivElement;
  const filtersDiv = document.getElementById('filters') as HTMLDivElement;

  searchInput.value = '';
  searchInput.setAttribute('disabled', '');

  if (newTicketButton.classList.contains('rotate') === false) {
    newTicketButton.classList.add('rotate');

    /**
     * Hide all tickets and filters
     */
    for (let i = 0; i < ticketsDiv.children.length; i++) {
      ticketsDiv.children[i].classList.add('hidden');
    }

    /**
     * Hide all filters
     */
    for (let i = 0; i < filtersDiv.children.length; i++) {
      filtersDiv.children[i].classList.add('hidden');
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
      'value': 'Creează tichet',
    });

    /**
     * Create ticket parameters
     */
    const newTicketParameters = document.createElement('div');
    newTicketParameters.id = 'ticketParameters';

    /**
     * Add ticket parameters
     */
    const newTicketParametersTitle = document.createElement('div');
    newTicketParametersTitle.className = 'new-ticket-title';
    newTicketParametersTitle.textContent = 'Parametrii incident';

    // Add requestor field
    const requestorDiv = document.createElement('div');
    requestorDiv.className = 'ticket-parameter requestor-div';

    const requestorTitle = document.createElement('div');
    requestorTitle.className = 'parameter-title requestor-title';
    requestorTitle.textContent = 'Solicitant';

    const requestor = document.createElement('div');
    requestor.className = 'requestor';

    const requestorProfilePicture = document.createElement('div');
    requestorProfilePicture.className = 'profile-picture';

    const requestorName = document.createElement('span');
    requestorName.className = 'profile-name';

    requestor.appendChild(requestorProfilePicture);
    requestor.appendChild(requestorName);

    request('GET', `/user/${window.sessionStorage.getItem('userId')}/info`)
      .then(({ body: response }) => {
        if (response['error'] === undefined) {
          requestorProfilePicture.textContent = response['userInfo']['displayNameInitials'];
          requestorName.textContent = response['userInfo']['displayName'];
        } else {
          snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
        }
      })
      .catch(() => {
        snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
      });

    appendChildrenToHTMLElement(requestorDiv, [requestorTitle, requestor]);

    // Add category field
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'ticket-parameter';

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

    appendChildrenToHTMLElement(categoryDiv, [categoryTitle, ticketCategoryInput]);

    // Add priority field
    const priorityDiv = document.createElement('div');
    priorityDiv.className = 'ticket-parameter';

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

    appendChildrenToHTMLElement(priorityDiv, [priorityTitle, ticketPriorityInput]);

    // Add assignee
    const assigneeDiv = document.createElement('div');
    assigneeDiv.className = 'ticket-parameter';

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
      .then(({ body: response }) => {
        if (response['error'] === undefined) {
          for (let i = 0; i < response['userList'].length; i++) {
            ticketAssigneeInput.add(
              new Option(response['userList'][i]['displayName'], response['userList'][i]['userId'])
            );
          }
        } else {
          if (response['error'] === 'user is not allowed to view the user list') {
            ticketAssigneeInput.setAttribute('disabled', '');
          } else {
            snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
          }
        }
      })
      .catch(() => {
        snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
      });

    appendChildrenToHTMLElement(assigneeDiv, [assigneeTitle, ticketAssigneeInput]);

    // Add start date
    const startDateDiv = document.createElement('div');
    startDateDiv.className = 'ticket-parameter';

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

    appendChildrenToHTMLElement(startDateDiv, [startDateTitle, ticketStartDateInput]);

    // Add end date
    const endDateDiv = document.createElement('div');
    endDateDiv.className = 'ticket-parameter';

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
      'minDate': flatpickr.parseDate(ticketStartDateInput.value, 'd/m/Y, H:i').fp_incr(1),
      'dateFormat': 'd/m/Y, H:i',
    });

    appendChildrenToHTMLElement(endDateDiv, [endDateTitle, ticketEndDateInput]);

    // Add ticket status
    const statusDiv = document.createElement('div');
    statusDiv.className = 'ticket-parameter';

    const statusTitle = document.createElement('label');
    setAttributes(statusTitle, {
      'class': 'parameter-title',
      'for': 'ticketStatusTitle',
    });
    statusTitle.textContent = 'Incident solutionat*';

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
    ticketStatusInput.add(new Option('Da', '1'));
    ticketStatusInput.add(new Option('Nu', '2'));

    appendChildrenToHTMLElement(statusDiv, [statusTitle, ticketStatusInput]);

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
     * Add elements to ticket parameters div
     */
    appendChildrenToHTMLElement(newTicketParameters, [
      newTicketParametersTitle,
      requestorDiv,
      categoryDiv,
      priorityDiv,
      assigneeDiv,
      startDateDiv,
      endDateDiv,
      statusDiv
    ]);

    /**
     * Add elements to visible form
     */
    appendChildrenToHTMLElement(newTicketForm, [
      ticketTitle,
      ticketTitleInput,
      ticketMessageInput,
      ticketSubmitButton
    ]);

    ticketsDiv.insertAdjacentElement('afterbegin', newTicketForm);
    filtersDiv.insertAdjacentElement('afterbegin', newTicketParameters);
  } else {
    const ticketForm = document.getElementById('ticketForm') as HTMLFormElement;
    const ticketParameters = document.getElementById('ticketParameters') as HTMLDivElement;

    newTicketButton.classList.remove('rotate');
    /**
    * Show all tickets
    */
    for (let i = 0; i < ticketsDiv.children.length; i++) {
      ticketsDiv.children[i].classList.remove('hidden');
    }

    /**
     * Show all filters
     */
    for (let i = 0; i < filtersDiv.children.length; i++) {
      filtersDiv.children[i].classList.remove('hidden');
    }

    ticketsDiv.classList.remove('gray-bg');

    startDateInput.destroy();
    endDateInput.destroy();

    ticketsDiv.removeChild(ticketForm);
    filtersDiv.removeChild(ticketParameters);

    searchInput.removeAttribute('disabled');
  }
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
  onKeyUpTicketTitleInput();
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
  ticketMessageInput.value = cleanTextArea(ticketMessageInput.value);
  onKeyUpTicketMessageInput();
}

function onChangeTicketStartDateInput() {
  endDateInput.set('minDate', startDateInput['latestSelectedDateObj'].fp_incr(1));
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
    request('POST', '/ticket', {
      'title': ticketTitleInput.value,
      'message': ticketMessageInput.value,
      'category': ticketCategoryInput.value,
      'priority': ticketPriorityInput.value,
      'assignee': ticketAssigneeInput.selectedIndex === 0 ? null : ticketAssigneeInput.value,
      'startDate': startDateInput['latestSelectedDateObj'],
      'endDate': ticketEndDateInput.value.length === 0 ? null : endDateInput['latestSelectedDateObj'],
      'status': ticketStatusInput.value,
    })
      .then(({ body: response, headers }) => {
        if (response['status'] === 'success') {
          snackbar('Tichetul a fost creat cu success!', 'green');
          setTimeout(function() {
            window.location.href = `${headers.get('location')}`;
          }, 1000);
        } else {
          switch (response['error']) {
            case 'invalid ticket start date':
              snackbar('Data inițială trebuie să fie în viitor!', 'red'); break;
            case 'invalid ticket end date':
              snackbar('Data finală trebuie să fie după data de început cu cel puțin o zi!', 'red'); break;
            default: snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
          }
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

/**
 * SEARCH AND FILTERING
 */

searchInput.onkeyup = () => {
  const ticketDivs = document.getElementById('tickets') as HTMLDivElement;
  for (let i = 0; i < ticketDivs.children.length; i++) {
    const ticketId =
      ticketDivs.children[i].getElementsByClassName('ticket-id')[0].textContent as string;
    const ticketTitle =
      (ticketDivs.children[i].getElementsByClassName('ticket-title')[0].textContent as string).toLowerCase();
    const ticketMessage =
      (ticketDivs.children[i].getElementsByClassName('ticket-message')[0].textContent as string).toLowerCase();

    if (
      ticketId.includes(searchInput.value) === true ||
      ticketTitle.includes(searchInput.value.toLowerCase()) === true ||
      ticketMessage.includes(searchInput.value.toLowerCase()) === true
    ) {
      ticketDivs.children[i].classList.remove('hidden');
    } else {
      if (searchInput.value.length === 0) {
        ticketDivs.children[i].classList.remove('hidden');
      } else {
        ticketDivs.children[i].classList.add('hidden');
      }
    }
  }
};

const removeStatusFilterButton = document.getElementById('removeStatusFilter') as HTMLDivElement;
const removePriorityFilterButton = document.getElementById('removePriorityFilter') as HTMLDivElement;
const removeDepartmentFilterButton = document.getElementById('removeDepartmentFilter') as HTMLDivElement;
const removeEndDateFilterButton = document.getElementById('removeEndDateFilter') as HTMLDivElement;
const removeAssigneeFilterButton = document.getElementById('removeAssigneeFilter') as HTMLDivElement;

const filterGroupDivs = document.getElementsByClassName('filter-group');

const filterGroups: {
  checkBoxes: HTMLInputElement[]
  labelNames: string[]
}[] = [];

for (let i = 0; i < filterGroupDivs.length; i++) {
  const checkBoxes: HTMLInputElement[] = [];
  const labelNames: string[] = [];

  const groupCheckBoxes = filterGroupDivs[i].getElementsByClassName('filter-checkbox');
  for (let j = 0; j < groupCheckBoxes.length; j++) {
    const checkBox = groupCheckBoxes[j].getElementsByTagName('input')[0];
    checkBox.onclick = filterUpdate;
    checkBoxes.push(checkBox);
    labelNames.push(groupCheckBoxes[j].getElementsByTagName('label')[0].textContent as string);
  }

  filterGroups.push({ checkBoxes, labelNames });
}

/**
 * Handles the filter updates
 */
function filterUpdate() {
  for (let i = 0; i < filterGroups.length; i++) {
    const checked: string[] = [];
    for (let j = 0; j < filterGroups[i].checkBoxes.length; j++) {
      if (filterGroups[i].checkBoxes[j].checked === true) {
        checked.push(filterGroups[i].labelNames[j]);
      }
    }

    const ticketDivs = document.getElementById('tickets') as HTMLDivElement;
    for (let j = 0; j < ticketDivs.children.length; j++) {
      switch (i) {
        case 0: {
          const ticketStatus =
            ticketDivs.children[j].getElementsByClassName('ticket-status')[0].textContent as string;

          if (checked.includes(ticketStatus) === true || checked.length === 0) {
            ticketDivs.children[j].classList.remove('filter-status');
          } else {
            ticketDivs.children[j].classList.add('filter-status');
          }
          break;
        }
        case 1: {
          const ticketPriority =
            ticketDivs.children[j].getElementsByClassName('ticket-priority')[0].textContent as string;

          if (checked.includes(ticketPriority) === true || checked.length === 0) {
            ticketDivs.children[j].classList.remove('filter-priority');
          } else {
            ticketDivs.children[j].classList.add('filter-priority');
          }
          break;
        }
        case 2: {
          const ticketDepartment =
            ticketDivs.children[j].getElementsByClassName('ticket-department')[0].textContent as string;

          if (checked.includes(ticketDepartment) === true || checked.length === 0) {
            ticketDivs.children[j].classList.remove('filter-department');
          } else {
            ticketDivs.children[j].classList.add('filter-department');
          }
          break;
        }
        case 3: {
          const ticketEndDate =
            ticketDivs.children[j].getElementsByClassName('ticket-enddate')[0].textContent as string;

          if (checked.length !== 0) {
            const ticketEndDateFilters: boolean[] = [false, false, false];
            for (let k = 0; k < checked.length; k++) {
              switch (checked[k]) {
                case 'În termen':
                  if (ticketEndDate.startsWith('peste') === true) {
                    ticketEndDateFilters[0] = true;
                  }
                  break;
                case 'Termen depășit':
                  if (ticketEndDate.startsWith('acum') === true) {
                    ticketEndDateFilters[1] = true;
                  }
                  break;
                case 'Fără termen limită':
                  if (ticketEndDate === '~') {
                    ticketEndDateFilters[2] = true;
                  }
                  break;
              }
            }
            if (
              ticketEndDateFilters[0] === true ||
              ticketEndDateFilters[1] === true ||
              ticketEndDateFilters[2] === true
            ) {
              ticketDivs.children[j].classList.remove('filter-enddate');
            } else {
              ticketDivs.children[j].classList.add('filter-enddate');
            }
          } else {
            ticketDivs.children[j].classList.remove('filter-enddate');
          }
          break;
        }
        case 4: {
          const ticketAssignee =
            ticketDivs.children[j].getElementsByClassName('ticket-assignee')[0].textContent as string;

          if (checked.length !== 0) {
            const ticketAssigneeFilters: boolean[] = [false, false];
            for (let k = 0; k < checked.length; k++) {
              switch (checked[k]) {
                case 'Cu responsabil':
                  if (ticketAssignee !== '~') {
                    ticketAssigneeFilters[0] = true;
                  }
                  break;
                case 'Fără responsabil':
                  if (ticketAssignee === '~') {
                    ticketAssigneeFilters[1] = true;
                  }
                  break;
              }
            }
            if (ticketAssigneeFilters[0] === true || ticketAssigneeFilters[1] === true) {
              ticketDivs.children[j].classList.remove('filter-assignee');
            } else {
              ticketDivs.children[j].classList.add('filter-assignee');
            }
          } else {
            ticketDivs.children[j].classList.remove('filter-assignee');
          }
          break;
        }
      }
    }
  }
}

removeStatusFilterButton.onclick = () => {
  for (let i = 0; i < filterGroups[0].checkBoxes.length; i++) {
    filterGroups[0].checkBoxes[i].checked = false;
  }
  filterUpdate();
};

removePriorityFilterButton.onclick = () => {
  for (let i = 0; i < filterGroups[1].checkBoxes.length; i++) {
    filterGroups[1].checkBoxes[i].checked = false;
  }
  filterUpdate();
};

removeDepartmentFilterButton.onclick = () => {
  for (let i = 0; i < filterGroups[2].checkBoxes.length; i++) {
    filterGroups[2].checkBoxes[i].checked = false;
  }
  filterUpdate();
};

removeEndDateFilterButton.onclick = () => {
  for (let i = 0; i < filterGroups[3].checkBoxes.length; i++) {
    filterGroups[3].checkBoxes[i].checked = false;
  }
  filterUpdate();
};

removeAssigneeFilterButton.onclick = () => {
  for (let i = 0; i < filterGroups[4].checkBoxes.length; i++) {
    filterGroups[4].checkBoxes[i].checked = false;
  }
  filterUpdate();
};
