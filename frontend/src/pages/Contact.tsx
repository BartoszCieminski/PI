import React from 'react';

const Contact: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Kontakt</h1>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <p>Skontaktuj się z nami:</p>
        <ul>
          <li>Email: kontakt@fitnessclub.pl</li>
          <li>Telefon: +48 123 456 789</li>
          <li>Adres: ul. Przykładowa 123, 00-000 Warszawa</li>
        </ul>
        
        <form style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="name">Imię i nazwisko:</label>
            <input
              type="text"
              id="name"
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="message">Wiadomość:</label>
            <textarea
              id="message"
              rows={5}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          
          <button 
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Wyślij wiadomość
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;