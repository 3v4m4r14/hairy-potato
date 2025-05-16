import React from 'react';
import './App.css';
import SlotMachine from './components/SlotMachine';

function App() {
  return (
    <div className="App">
      <div className="app-container">
        <SlotMachine />
        <footer className="footer">
          <a 
            href="https://buymeacoffee.com/animatedchaos" 
            target="_blank" 
            rel="noopener noreferrer"
            className="coffee-link"
          >
            ☕ Buy me a coffee
          </a>
          <div>© {new Date().getFullYear()} All rights reserved</div>
        </footer>
      </div>
    </div>
  );
}

export default App;
