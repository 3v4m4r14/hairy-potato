import React, { useState } from 'react';
import './SlotMachine.css';

// Weighted symbols array - common symbols appear multiple times to increase their frequency
const SYMBOLS = [
  '🏁', '🏁', '🏁', '🏁',  // 4x Checkered Flag (most common)
  '🔧', '🔧', '🔧', '🔧',  // 4x Tools
  '⛑️', '⛑️', '⛑️',       // 3x Helmet
  '🛵', '🛵', '🛵',        // 3x Scooter
  '🏆', '🏆',              // 2x Trophy
  '🏍️',                    // 1x Sport Bike (rare)
  '🦔'                      // 1x Hedgehog (rarest)
];

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
    // Adjusted jackpot multipliers
    const jackpotMultiplier = {
      3: 25,   // 3 hedgehogs anywhere
      4: 75,   // 4 hedgehogs anywhere
      5: 150,  // 5 hedgehogs anywhere
      6: 300,  // 6 hedgehogs anywhere
      7: 1000  // 7 or more hedgehogs (super rare jackpot)
    };
    const multiplier = jackpotMultiplier[Math.min(7, hedgehogCount)] || 1000;
    totalWin += betAmount * multiplier;
  }

  // Check horizontal lines
  for (let row = 0; row < GRID_HEIGHT; row++) {
    const rowStart = row * GRID_WIDTH;
    const rowSymbols = reels.slice(rowStart, rowStart + GRID_WIDTH);
    
    // Check 5 in a row (now harder to get)
    if (rowSymbols.every(symbol => symbol === rowSymbols[0])) {
      const multiplier = rowSymbols[0] === '🦔' ? 75 : 
                        rowSymbols[0] === '🏍️' ? 25 : 
                        rowSymbols[0] === '🏆' ? 15 : 10;
      totalWin += betAmount * multiplier;
      continue;
    }
    
    // Check 4 in a row
    for (let i = 0; i <= 1; i++) {
      const fourSymbols = rowSymbols.slice(i, i + 4);
      if (fourSymbols.every(symbol => symbol === fourSymbols[0])) {
        const multiplier = fourSymbols[0] === '🦔' ? 35 :
                          fourSymbols[0] === '🏍️' ? 15 :
                          fourSymbols[0] === '🏆' ? 8 : 5;
        totalWin += betAmount * multiplier;
        break;
      }
    }
    
    // Check 3 in a row (now requires specific symbols)
    for (let i = 0; i <= 2; i++) {
      const threeSymbols = rowSymbols.slice(i, i + 3);
      // Only special symbols pay for 3 in a row
      if (threeSymbols.every(symbol => symbol === threeSymbols[0]) &&
          ['🦔', '🏍️', '🏆'].includes(threeSymbols[0])) {
        const multiplier = threeSymbols[0] === '🦔' ? 20 :
                          threeSymbols[0] === '🏍️' ? 8 :
                          threeSymbols[0] === '🏆' ? 5 : 0;
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
      const multiplier = colSymbols[0] === '🦔' ? 50 :
                        colSymbols[0] === '🏍️' ? 20 :
                        colSymbols[0] === '🏆' ? 12 : 8;
      totalWin += betAmount * multiplier;
      continue;
    }
    
    // Check 3 in a column (now requires specific symbols)
    for (let i = 0; i <= 1; i++) {
      const threeSymbols = colSymbols.slice(i, i + 3);
      // Only special symbols pay for 3 in a column
      if (threeSymbols.every(symbol => symbol === threeSymbols[0]) &&
          ['🦔', '🏍️', '🏆'].includes(threeSymbols[0])) {
        const multiplier = threeSymbols[0] === '🦔' ? 25 :
                          threeSymbols[0] === '🏍️' ? 10 :
                          threeSymbols[0] === '🏆' ? 6 : 0;
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
        {lastWin > 0 && (
          <div className={`win-message-overlay ${lastWin >= betAmount * 25 ? 'jackpot' : ''}`}>
            {lastWin >= betAmount * 25 ? '🎉 JACKPOT! ' : ''}
            You won {lastWin} coins! {lastWin >= betAmount * 25 ? '🦔' : '🏆'}
          </div>
        )}
      </div>
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
      <button 
        onClick={spin} 
        disabled={isSpinning || coins < betAmount}
        className="spin-button"
      >
        {isSpinning ? 'Revving...' : `Ride! (${betAmount} coins)`}
      </button>
      <div className="payouts">
        <div className="jackpot-info">🦔 Lucky Hedgehog Jackpots 🦔</div>
        <div>7+ Hedgehogs: 1000x</div>
        <div>6 Hedgehogs: 300x</div>
        <div>5 Hedgehogs: 150x</div>
        <div>4 Hedgehogs: 75x</div>
        <div>3 Hedgehogs: 25x</div>
        <div className="regular-wins">Special Symbol Wins</div>
        <div>5 Hedgehogs: 75x</div>
        <div>5 Sport Bikes: 25x</div>
        <div>5 Trophies: 15x</div>
        <div>4 in a row: 5-15x</div>
        <div>3 special symbols: 5-8x</div>
        <div>4 in column: 8-20x</div>
      </div>
    </div>
  );
};

export default SlotMachine; 