'use strict';

const messageInput = document.getElementById('messageInput');
const messageSendButton = document.getElementById('send-message');

const statusEditButton = document.getElementById('statusEdit');
const assigneeEditButton = document.getElementById('assigneeEdit');
const priorityEditButton = document.getElementById('priorityEdit');
const departmentEditButton = document.getElementById('departmentEdit');
const endDateEditButton = document.getElementById('endDateEdit');

if (messageInput !== null && messageSendButton !== null) {
  messageInput.onkeyup = onKeyUpMessageInput;
  messageInput.onblur = onBlurMessageInput;
  messageSendButton.onclick = onClickMessageSendButton;
}

if (statusEditButton !== null) {
  statusEditButton.onclick = onClickStatusEditButton;
}

if (assigneeEditButton !== null) {
  assigneeEditButton.onclick = onClickAssigneeEditButton;
}

if (priorityEditButton !== null) {
  priorityEditButton.onclick = onClickPriorityEditButton;
}

if (departmentEditButton !== null) {
  departmentEditButton.onclick = onClickDepartmentEditButton;
}

if (endDateEditButton !== null) {
  endDateEditButton.onclick = onClickEndDateEditButton;
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

function onClickStatusEditButton() {
  const ticketStatusDiv = document.getElementById('ticketStatus') as HTMLDivElement;
  const ticketStatusDivParent = ticketStatusDiv.parentElement as HTMLDivElement;
  ticketStatusDivParent.removeChild(ticketStatusDiv);
  ((statusEditButton as HTMLImageElement).parentElement as HTMLDivElement)
    .removeChild(statusEditButton as HTMLImageElement);

  const ticketStatusForm = document.createElement('form');
  ticketStatusForm.className = 'ticket-edit-form';
  const ticketStatusSelect = document.createElement('select');

  const ticketStatusDefault = new Option('Alege statutul', '0');
  setAttributes(ticketStatusDefault, {
    'disabled': '',
    'hidden': '',
    'selected': '',
  });
  ticketStatusSelect.add(ticketStatusDefault);
  request('GET', `${window.location.pathname}/allowedStatuses`)
    .then(({ body: response }) => {
      if (response['error'] === undefined) {
        for (let i = 0; i < response.length; i++) {
          ticketStatusSelect.add(new Option(response[i]['statusName'], response[i]['statusId']));
        }
      }
    })
    .catch(() => {
      snackbar('Ceva nu a mers bine. Mai încearcă odată!', 'red');
    });

  const ticketStatusSubmitButton = document.createElement('input');
  setAttributes(ticketStatusSubmitButton, {
    'type': 'submit',
    'value': 'Modifică',
  });

  ticketStatusSubmitButton.onclick = (event: MouseEvent) => {
    if (ticketStatusSelect.value !== '0') {
      request('PATCH', window.location.pathname, {
        'event': 'changeStatus',
        'status': ticketStatusSelect.value,
      })
        .then(({ body: response }) => {
          if (response['error'] === undefined) {
            location.reload();
          }
        })
        .catch(() => {
          snackbar('Ceva nu a mers bine. Mai încearcă odată!', 'red');
        });
    } else {
      location.reload();
    }
    event.preventDefault();
  };

  ticketStatusForm.appendChild(ticketStatusSelect);
  ticketStatusForm.appendChild(ticketStatusSubmitButton);
  ticketStatusDivParent.appendChild(ticketStatusForm);
}

function onClickAssigneeEditButton() {
  const ticketAssigneeDiv = document.getElementById('ticketAssignee') as HTMLAnchorElement;
  const ticketAssigneeDivParent = ticketAssigneeDiv.parentElement as HTMLDivElement;
  ticketAssigneeDivParent.removeChild(ticketAssigneeDiv);
  ((assigneeEditButton as HTMLImageElement).parentElement as HTMLDivElement)
    .removeChild(assigneeEditButton as HTMLImageElement);

  const ticketAssigneeForm = document.createElement('form');
  ticketAssigneeForm.className = 'ticket-edit-form';
  const ticketAssigneeSelect = document.createElement('select');

  request('GET', '/user/list')
    .then(({ body: response }) => {
      if (response['error'] === undefined) {
        request('GET', `${window.location.pathname}/assignee`)
          .then(({ body: response2 }) => {
            if (response2['error'] === undefined) {
              for (let i = 0; i < response['userList'].length; i++) {
                const option = new Option(response['userList'][i]['displayName'], response['userList'][i]['userId']);
                if (response['userList'][i]['userId'] === response2['assigneeId']) {
                  setAttributes(option, {
                    'disabled': '',
                    'hidden': '',
                    'selected': '',
                  });
                  option.value = '0';
                }
                ticketAssigneeSelect.add(option);
              }
              if (response2['assigneeId'] === null) {
                const ticketAssigneeDefault = new Option('Alege responsabilul', '0');
                setAttributes(ticketAssigneeDefault, {
                  'disabled': '',
                  'hidden': '',
                  'selected': '',
                });
                ticketAssigneeSelect.add(ticketAssigneeDefault);
              }
            }
          });
      }
    })
    .catch(() => {
      snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
    });

  const ticketAssigneeSubmitButton = document.createElement('input');
  setAttributes(ticketAssigneeSubmitButton, {
    'type': 'submit',
    'value': 'Modifică',
  });

  ticketAssigneeSubmitButton.onclick = (event: MouseEvent) => {
    if (ticketAssigneeSelect.value !== '0') {
      request('PATCH', window.location.pathname, {
        'event': 'changeAssignee',
        'assigneeId': ticketAssigneeSelect.value,
      })
        .then(({ body: response }) => {
          if (response['error'] === undefined) {
            location.reload();
          }
        })
        .catch(() => {
          snackbar('Ceva nu a mers bine. Mai încearcă odată!', 'red');
        });
    } else {
      location.reload();
    }
    event.preventDefault();
  };

  ticketAssigneeForm.appendChild(ticketAssigneeSelect);
  ticketAssigneeForm.appendChild(ticketAssigneeSubmitButton);
  ticketAssigneeDivParent.appendChild(ticketAssigneeForm);
}

function onClickPriorityEditButton() {
  const ticketPriorityDiv = document.getElementById('ticketPriority') as HTMLDivElement;
  const ticketPriorityDivParent = ticketPriorityDiv.parentElement as HTMLDivElement;
  ticketPriorityDivParent.removeChild(ticketPriorityDiv);
  ((priorityEditButton as HTMLImageElement).parentElement as HTMLDivElement)
    .removeChild(priorityEditButton as HTMLImageElement);

  const ticketPriorityForm = document.createElement('form');
  ticketPriorityForm.className = 'ticket-edit-form';
  const ticketPrioritySelect = document.createElement('select');

  ticketPrioritySelect.add(new Option('Scăzut', '1'));
  ticketPrioritySelect.add(new Option('Mediu', '2'));
  ticketPrioritySelect.add(new Option('Ridicat', '3'));
  ticketPrioritySelect.add(new Option('Urgent', '4'));

  request('GET', `${window.location.pathname}/priority`)
    .then(({ body: response }) => {
      if (response['error'] === undefined) {
        setAttributes(ticketPrioritySelect.options[response['priorityId'] - 1], {
          'disabled': '',
          'hidden': '',
          'selected': '',
        });
        ticketPrioritySelect.options[response['priorityId'] - 1].value = '0';
      }
    })
    .catch(() => {
      snackbar('Ceva nu a mers bine. Mai încearcă odată!', 'red');
    });

  const ticketPrioritySubmitButton = document.createElement('input');
  setAttributes(ticketPrioritySubmitButton, {
    'type': 'submit',
    'value': 'Modifică',
  });

  ticketPrioritySubmitButton.onclick = (event: MouseEvent) => {
    if (ticketPrioritySelect.value !== '0') {
      request('PATCH', window.location.pathname, {
        'event': 'changePriority',
        'priorityId': ticketPrioritySelect.value,
      })
        .then(({ body: response }) => {
          if (response['error'] === undefined) {
            location.reload();
          }
        })
        .catch(() => {
          snackbar('Ceva nu a mers bine. Mai încearcă odată!', 'red');
        });
    } else {
      location.reload();
    }
    event.preventDefault();
  };

  ticketPriorityForm.appendChild(ticketPrioritySelect);
  ticketPriorityForm.appendChild(ticketPrioritySubmitButton);
  ticketPriorityDivParent.appendChild(ticketPriorityForm);
}

function onClickDepartmentEditButton() {
  const ticketDepartmentDiv = document.getElementById('ticketDepartment') as HTMLDivElement;
  const ticketDepartmentDivParent = ticketDepartmentDiv.parentElement as HTMLDivElement;
  ticketDepartmentDivParent.removeChild(ticketDepartmentDiv);
  ((departmentEditButton as HTMLImageElement).parentElement as HTMLDivElement)
    .removeChild(departmentEditButton as HTMLImageElement);

  const ticketDepartmentForm = document.createElement('form');
  ticketDepartmentForm.className = 'ticket-edit-form';
  const ticketDepartmentSelect = document.createElement('select');

  ticketDepartmentSelect.add(new Option('IT', '1'));
  ticketDepartmentSelect.add(new Option('Dezvoltare software', '2'));
  ticketDepartmentSelect.add(new Option('Operațiuni', '3'));
  ticketDepartmentSelect.add(new Option('Marketing', '4'));
  ticketDepartmentSelect.add(new Option('Resurse umane', '5'));

  request('GET', `${window.location.pathname}/department`)
    .then(({ body: response }) => {
      if (response['error'] === undefined) {
        setAttributes(ticketDepartmentSelect.options[response['departmentId'] - 1], {
          'disabled': '',
          'hidden': '',
          'selected': '',
        });
        ticketDepartmentSelect.options[response['departmentId'] - 1].value = '0';
      }
    })
    .catch(() => {
      snackbar('Ceva nu a mers bine. Mai încearcă odată!', 'red');
    });

  const ticketDepartmentSubmitButton = document.createElement('input');
  setAttributes(ticketDepartmentSubmitButton, {
    'type': 'submit',
    'value': 'Modifică',
  });

  ticketDepartmentSubmitButton.onclick = (event: MouseEvent) => {
    if (ticketDepartmentSelect.value !== '0') {
      request('PATCH', window.location.pathname, {
        'event': 'changeDepartment',
        'departmentId': ticketDepartmentSelect.value,
      })
        .then(({ body: response }) => {
          if (response['error'] === undefined) {
            location.reload();
          }
        })
        .catch(() => {
          snackbar('Ceva nu a mers bine. Mai încearcă odată!', 'red');
        });
    } else {
      location.reload();
    }
    event.preventDefault();
  };

  ticketDepartmentForm.appendChild(ticketDepartmentSelect);
  ticketDepartmentForm.appendChild(ticketDepartmentSubmitButton);
  ticketDepartmentDivParent.appendChild(ticketDepartmentForm);
}

function onClickEndDateEditButton() {
  const ticketEndDateDiv = document.getElementById('ticketEndDate') as HTMLDivElement;
  const ticketEndDateDivParent = ticketEndDateDiv.parentElement as HTMLDivElement;
  ticketEndDateDivParent.removeChild(ticketEndDateDiv);
  ((endDateEditButton as HTMLImageElement).parentElement as HTMLDivElement)
    .removeChild(endDateEditButton as HTMLImageElement);

  const ticketEndDateForm = document.createElement('form');
  ticketEndDateForm.className = 'ticket-edit-form';
  const ticketEndDateInput = document.createElement('input');

  let endDateInput: flatpickr.Instance;

  request('GET', `${window.location.pathname}/dates`)
    .then(({ body: response }) => {
      if (response['error'] === undefined) {
        endDateInput = flatpickr(ticketEndDateInput, {
          'locale': 'ro',
          'disableMobile': true,
          'enableTime': true,
          'defaultDate': response['endDate'] === null ? new Date() : response['endDate'],
          'minDate': flatpickr.parseDate(response['startDate'], 'd/m/Y, H:i').fp_incr(1),
          'dateFormat': 'd/m/Y, H:i',
        });

        const ticketEndDateSubmitButton = document.createElement('input');
        setAttributes(ticketEndDateSubmitButton, {
          'type': 'submit',
          'value': 'Modifică',
        });

        ticketEndDateSubmitButton.onclick = (event: MouseEvent) => {
          if (
            response['endDate'] === null ||
            flatpickr.parseDate(response['endDate']).getTime() !==
            flatpickr.parseDate(endDateInput['latestSelectedDateObj']).getTime()
          ) {
            request('PATCH', window.location.pathname, {
              'event': 'changeEndDate',
              'endDate': endDateInput['latestSelectedDateObj'],
            })
              .then(({ body: response2 }) => {
                if (response2['error'] === undefined) {
                  location.reload();
                } else {
                  if (response2['error'] === 'invalid ticket end date') {
                    snackbar('Termenul limită trebuie să fie după data de început cu cel puțin o zi!', 'red');
                  }
                }
              });
          } else {
            location.reload();
          }
          event.preventDefault();
        };

        ticketEndDateForm.appendChild(ticketEndDateInput);
        ticketEndDateForm.appendChild(ticketEndDateSubmitButton);
        ticketEndDateDivParent.appendChild(ticketEndDateForm);
      }
    })
    .catch(() => {
      snackbar('Ceva nu a mers bine. Mai încearcă odată!', 'red');
    });
}
