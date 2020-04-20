'use strict';

const logoutButton = document.getElementById('logoutButton') as HTMLAnchorElement;

logoutButton.addEventListener('click', function() {
  request('GET', '/logout')
    .then(response => {
      if (response['response'] === true) {
        window.location.href = '/auth';
      } else {
        snackbar('Deconectarea a eșuat. Încearcă mai târziu!', 'red');
      }
    })
    .catch((error: Error) => {
      if (error.message === 'network error' || error.message === 'invalid json') {
        snackbar('Nu s-a putut realiza conexiunea la server. Încearcă mai târziu!', 'red');
      } else {
        snackbar('Ceva nu a mers bine. Încearcă mai târziu!', 'red');
      }
    });
});
