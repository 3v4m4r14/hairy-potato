import React, { useState } from 'react';
import './SlotMachine.css';

const SYMBOLS = ['🏍️', '🛵', '⛑️', '🏆', '🔧', '🏁'];
const SYMBOL_VALUES = {
  '🏍️': 'Sport Bike',
  '🛵': 'Scooter',
  '⛑️': 'Helmet',
  '🏆': 'Trophy',
  '🔧': 'Tools',
  '🏁': 'Checkered Flag'
};

const MIN_BET = 10;
const MAX_BET = 50;
const GRID_WIDTH = 5;
const GRID_HEIGHT = 4;

const checkWin = (reels, betAmount) => {
  let totalWin = 0;

  // Check horizontal lines
  for (let row = 0; row < GRID_HEIGHT; row++) {
    const rowStart = row * GRID_WIDTH;
    const rowSymbols = reels.slice(rowStart, rowStart + GRID_WIDTH);
    
    // Check 5 in a row
    if (rowSymbols.every(symbol => symbol === rowSymbols[0])) {
      // Sport Bike pays extra
      const multiplier = rowSymbols[0] === '🏍️' ? 15 : 10;
      totalWin += betAmount * multiplier;
      continue;
    }
    
    // Check 4 in a row
    for (let i = 0; i <= 1; i++) {
      const fourSymbols = rowSymbols.slice(i, i + 4);
      if (fourSymbols.every(symbol => symbol === fourSymbols[0])) {
        const multiplier = fourSymbols[0] === '🏍️' ? 8 : 5;
        totalWin += betAmount * multiplier;
        break;
      }
    }
    
    // Check 3 in a row
    for (let i = 0; i <= 2; i++) {
      const threeSymbols = rowSymbols.slice(i, i + 3);
      if (threeSymbols.every(symbol => symbol === threeSymbols[0])) {
        const multiplier = threeSymbols[0] === '🏍️' ? 5 : 3;
        totalWin += betAmount * multiplier;
        break;
      }
    }
  }

  // Check vertical lines
  for (let col = 0; col < GRID_WIDTH; col++) {
    const colSymbols = [
      reels[col],
      reels[col + GRID_WIDTH],
      reels[col + GRID_WIDTH * 2],
      reels[col + GRID_WIDTH * 3]
    ];
    
    // Check 4 in a column
    if (colSymbols.every(symbol => symbol === colSymbols[0])) {
      const multiplier = colSymbols[0] === '🏍️' ? 12 : 8;
      totalWin += betAmount * multiplier;
      continue;
    }
    
    // Check 3 in a column
    for (let i = 0; i <= 1; i++) {
      const threeSymbols = colSymbols.slice(i, i + 3);
      if (threeSymbols.every(symbol => symbol === threeSymbols[0])) {
        const multiplier = threeSymbols[0] === '🏍️' ? 6 : 4;
        totalWin += betAmount * multiplier;
        break;
      }
    }
  }

  return totalWin;
};

const SlotMachine = () => {
  const initialReels = Array(GRID_WIDTH * GRID_HEIGHT).fill('🏍️');
  const [reels, setReels] = useState(initialReels);
  const [isSpinning, setIsSpinning] = useState(false);
  const [coins, setCoins] = useState(100);
  const [betAmount, setBetAmount] = useState(MIN_BET);
  const [lastWin, setLastWin] = useState(0);
  const [hoveredSymbol, setHoveredSymbol] = useState(null);

  const adjustBet = (amount) => {
    const newBet = Math.max(MIN_BET, Math.min(MAX_BET, betAmount + amount));
    setBetAmount(newBet);
  };

  const spin = () => {
    if (coins < betAmount) return;
    
    setIsSpinning(true);
    setCoins(prev => prev - betAmount);
    setLastWin(0);
    setHoveredSymbol(null);

    const spinDuration = 2000;
    const intervals = 10;
    let count = 0;

    const spinInterval = setInterval(() => {
      setReels(Array(GRID_WIDTH * GRID_HEIGHT).fill(0).map(() => 
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      ));
      count++;

      if (count >= intervals) {
        clearInterval(spinInterval);
        setIsSpinning(false);
        
        const finalReels = Array(GRID_WIDTH * GRID_HEIGHT).fill(0).map(() => 
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        );
        setReels(finalReels);
        
        const winAmount = checkWin(finalReels, betAmount);
        if (winAmount > 0) {
          setLastWin(winAmount);
          setCoins(prev => prev + winAmount);
        }
      }
    }, spinDuration / intervals);
  };

  const renderGrid = () => {
    const grid = [];
    for (let row = 0; row < GRID_HEIGHT; row++) {
      const rowElements = [];
      for (let col = 0; col < GRID_WIDTH; col++) {
        const index = row * GRID_WIDTH + col;
        rowElements.push(
          <div 
            key={`${row}-${col}`} 
            className="reel"
            onMouseEnter={() => setHoveredSymbol(reels[index])}
            onMouseLeave={() => setHoveredSymbol(null)}
          >
            {reels[index]}
          </div>
        );
      }
      grid.push(
        <div key={row} className="reel-row">
          {rowElements}
        </div>
      );
    }
    return grid;
  };

  return (
    <div className="slot-machine">
      <div className="title">Moto Slots</div>
      <div className="coins">Coins: {coins}</div>
      {lastWin > 0 && <div className="win-message">You won {lastWin} coins! 🏆</div>}
      {hoveredSymbol && (
        <div className="symbol-tooltip">
          {SYMBOL_VALUES[hoveredSymbol]}
        </div>
      )}
      <div className="bet-controls">
        <button 
          onClick={() => adjustBet(-5)} 
          disabled={betAmount <= MIN_BET}
          className="bet-button"
        >
          -
        </button>
        <div className="bet-amount">Bet: {betAmount}</div>
        <button 
          onClick={() => adjustBet(5)} 
          disabled={betAmount >= MAX_BET || coins < betAmount + 5}
          className="bet-button"
        >
          +
        </button>
      </div>
      <div className="reels-container">
        {renderGrid()}
      </div>
      <div className="payouts">
        <div>5x Sport Bikes: 15x</div>
        <div>4x Sport Bikes: 8x</div>
        <div>5 in a row: 10x</div>
        <div>4 in a row: 5x</div>
        <div>4 in column: 8x</div>
        <div>3 in column: 4x</div>
      </div>
      <button 
        onClick={spin} 
        disabled={isSpinning || coins < betAmount}
        className="spin-button"
      >
        {isSpinning ? 'Revving...' : `Ride! (${betAmount} coins)`}
      </button>
    </div>
  );
};

export default SlotMachine; 