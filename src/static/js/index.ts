'use strict';

const logoutButton = document.getElementById('logoutButton') as HTMLAnchorElement;

logoutButton.addEventListener('click', function() {
  request('GET', '/logout', undefined)
    .then(response => {
      if (response['response'] === true) {
        console.log('response' + response);
        window.location.href = '/auth';
      } else {
        snackbar('Deconectarea a eșuat. Încearcă mai târziu!', 'red');
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
});
