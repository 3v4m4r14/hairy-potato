import React, { useState } from 'react';
import './SlotMachine.css';

const SYMBOLS = ['🦔', '🏍️', '🛵', '⛑️', '🏆', '🔧', '🏁'];
const SYMBOL_VALUES = {
  '🦔': 'Lucky Hedgehog (Jackpot)',
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

  // Check for Hedgehog Jackpot patterns
  const hedgehogCount = reels.filter(symbol => symbol === '🦔').length;
  if (hedgehogCount >= 3) {
    // Progressive jackpot based on number of hedgehogs
    const jackpotMultiplier = {
      3: 20,  // 3 hedgehogs anywhere
      4: 50,  // 4 hedgehogs anywhere
      5: 100, // 5 hedgehogs anywhere
      6: 200, // 6 hedgehogs anywhere
      7: 500  // 7 or more hedgehogs
    };
    const multiplier = jackpotMultiplier[Math.min(7, hedgehogCount)] || 500;
    totalWin += betAmount * multiplier;
  }

  // Check horizontal lines
  for (let row = 0; row < GRID_HEIGHT; row++) {
    const rowStart = row * GRID_WIDTH;
    const rowSymbols = reels.slice(rowStart, rowStart + GRID_WIDTH);
    
    // Check 5 in a row
    if (rowSymbols.every(symbol => symbol === rowSymbols[0])) {
      const multiplier = rowSymbols[0] === '🦔' ? 50 : 
                        rowSymbols[0] === '🏍️' ? 15 : 10;
      totalWin += betAmount * multiplier;
      continue;
    }
    
    // Check 4 in a row
    for (let i = 0; i <= 1; i++) {
      const fourSymbols = rowSymbols.slice(i, i + 4);
      if (fourSymbols.every(symbol => symbol === fourSymbols[0])) {
        const multiplier = fourSymbols[0] === '🦔' ? 25 :
                          fourSymbols[0] === '🏍️' ? 8 : 5;
        totalWin += betAmount * multiplier;
        break;
      }
    }
    
    // Check 3 in a row
    for (let i = 0; i <= 2; i++) {
      const threeSymbols = rowSymbols.slice(i, i + 3);
      if (threeSymbols.every(symbol => symbol === threeSymbols[0])) {
        const multiplier = threeSymbols[0] === '🦔' ? 15 :
                          threeSymbols[0] === '🏍️' ? 5 : 3;
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
      const multiplier = colSymbols[0] === '🦔' ? 40 :
                        colSymbols[0] === '🏍️' ? 12 : 8;
      totalWin += betAmount * multiplier;
      continue;
    }
    
    // Check 3 in a column
    for (let i = 0; i <= 1; i++) {
      const threeSymbols = colSymbols.slice(i, i + 3);
      if (threeSymbols.every(symbol => symbol === threeSymbols[0])) {
        const multiplier = threeSymbols[0] === '🦔' ? 20 :
                          threeSymbols[0] === '🏍️' ? 6 : 4;
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
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e) => {
    if (!isMobile) {
      setTooltipPosition({
        x: e.clientX + 10,
        y: e.clientY + 10
      });
    }
  };

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
            onMouseMove={handleMouseMove}
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
      {lastWin > 0 && (
        <div className={`win-message ${lastWin >= betAmount * 20 ? 'jackpot' : ''}`}>
          {lastWin >= betAmount * 20 ? '🎉 JACKPOT! ' : ''}
          You won {lastWin} coins! {lastWin >= betAmount * 20 ? '🦔' : '🏆'}
        </div>
      )}
      {hoveredSymbol && (
        <div 
          className="symbol-tooltip"
          style={!isMobile ? {
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`
          } : undefined}
        >
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
      <button 
        onClick={spin} 
        disabled={isSpinning || coins < betAmount}
        className="spin-button"
      >
        {isSpinning ? 'Revving...' : `Ride! (${betAmount} coins)`}
      </button>
      <div className="payouts">
        <div className="jackpot-info">🦔 Lucky Hedgehog Jackpots 🦔</div>
        <div>7+ Hedgehogs: 500x</div>
        <div>6 Hedgehogs: 200x</div>
        <div>5 Hedgehogs: 100x</div>
        <div>4 Hedgehogs: 50x</div>
        <div>3 Hedgehogs: 20x</div>
        <div className="regular-wins">Regular Wins</div>
        <div>5x Sport Bikes: 15x</div>
        <div>4x Sport Bikes: 8x</div>
        <div>5 in a row: 10x</div>
        <div>4 in a row: 5x</div>
        <div>4 in column: 8x</div>
        <div>3 in column: 4x</div>
      </div>
    </div>
  );
};

export default SlotMachine; 