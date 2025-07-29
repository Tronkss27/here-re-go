import React from 'react';

const TestHome = () => {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>🏠 TEST HOMEPAGE</h1>
      <p>Se vedi questo messaggio, il routing funziona!</p>
      <p>Ora i redirect a /login sono stati eliminati.</p>
      <a href="/sports-login">Accesso Admin</a> | <a href="/client-login">Accesso Cliente</a>
    </div>
  );
};

export default TestHome; 