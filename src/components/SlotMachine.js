import React, { useState } from 'react';
import './SlotMachine.css';
import { playSpinSound, playWinSound, playJackpotSound, toggleMute, getMuteState } from '../utils/audio';

// Weighted symbols array - common symbols appear multiple times to increase their frequency
const SYMBOLS = [
  '🏁', '🏁', '🏁', '🏁', '🏁',  // 5x Checkered Flag (most common)
  '🔧', '🔧', '🔧', '🔧', '🔧',  // 5x Tools
  '☕️', '☕️', '☕️', '☕️',       // 4x Coffee
  '🛵', '🛵', '🛵', '🛵',        // 4x Scooter
  '🏆', '🏆', '🏆',              // 3x Trophy
  '🏍️', '🏍️',                   // 2x Sport Bike
  '🦔'                           // 1x Hedgehog (ultra rare)
];

const SYMBOL_VALUES = {
  '🦔': 'Lucky Hedgehog (Jackpot)',
  '🏍️': 'Sport Bike',
  '🛵': 'Scooter',
  '☕️': 'Coffee',
  '🏆': 'Trophy',
  '🔧': 'Tools',
  '🏁': 'Checkered Flag'
};

const MIN_BET = 10;
const MAX_BET = 100;
const GRID_WIDTH = 5;
const GRID_HEIGHT = 4;

const checkWin = (reels, betAmount) => {
  let totalWin = 0;
  const winningPositions = new Set();

  // Check for Hedgehog Jackpot patterns
  const hedgehogPositions = reels.map((symbol, index) => symbol === '🦔' ? index : -1).filter(pos => pos !== -1);
  if (hedgehogPositions.length >= 3) {
    // Adjusted jackpot multipliers
    const jackpotMultiplier = {
      3: 8,     // was 15
      4: 25,    // was 40
      5: 75,    // was 100
      6: 150,   // was 250
      7: 500    // was 1000
    };
    const multiplier = jackpotMultiplier[Math.min(7, hedgehogPositions.length)] || 1000;
    totalWin += betAmount * multiplier;
    hedgehogPositions.forEach(pos => winningPositions.add(pos));
  }

  // Check horizontal lines
  for (let row = 0; row < GRID_HEIGHT; row++) {
    const rowStart = row * GRID_WIDTH;
    const rowSymbols = reels.slice(rowStart, rowStart + GRID_WIDTH);
    
    // Check 5 in a row
    if (rowSymbols.every(symbol => symbol === rowSymbols[0])) {
      const multiplier = rowSymbols[0] === '🦔' ? 15 :
                        rowSymbols[0] === '🏍️' ? 8 :
                        rowSymbols[0] === '🏆' ? 5 :
                        3;
      totalWin += betAmount * multiplier;
      for (let i = 0; i < GRID_WIDTH; i++) {
        winningPositions.add(rowStart + i);
      }
      continue;
    }
    
    // Check 4 in a row
    for (let i = 0; i <= 1; i++) {
      const fourSymbols = rowSymbols.slice(i, i + 4);
      if (fourSymbols.every(symbol => symbol === fourSymbols[0])) {
        const multiplier = fourSymbols[0] === '🦔' ? 10 :
                          fourSymbols[0] === '🏍️' ? 5 :
                          fourSymbols[0] === '🏆' ? 3 :
                          2;
        totalWin += betAmount * multiplier;
        for (let j = 0; j < 4; j++) {
          winningPositions.add(rowStart + i + j);
        }
        break;
      }
    }
    
    // Check 3 in a row
    for (let i = 0; i <= 2; i++) {
      const threeSymbols = rowSymbols.slice(i, i + 3);
      if (threeSymbols.every(symbol => symbol === threeSymbols[0]) &&
          ['🦔', '🏍️', '🏆'].includes(threeSymbols[0])) {
        const multiplier = threeSymbols[0] === '🦔' ? 5 :
                          threeSymbols[0] === '🏍️' ? 3 :
                          threeSymbols[0] === '🏆' ? 2 : 0;
        if (multiplier > 0) {
          totalWin += betAmount * multiplier;
          for (let j = 0; j < 3; j++) {
            winningPositions.add(rowStart + i + j);
          }
        }
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
      const multiplier = colSymbols[0] === '🦔' ? 12 :
                        colSymbols[0] === '🏍️' ? 6 :
                        colSymbols[0] === '🏆' ? 4 :
                        2;
      totalWin += betAmount * multiplier;
      for (let i = 0; i < 4; i++) {
        winningPositions.add(col + (i * GRID_WIDTH));
      }
      continue;
    }
    
    // Check 3 in a column
    for (let i = 0; i <= 1; i++) {
      const threeSymbols = colSymbols.slice(i, i + 3);
      if (threeSymbols.every(symbol => symbol === threeSymbols[0]) &&
          ['🦔', '🏍️', '🏆'].includes(threeSymbols[0])) {
        const multiplier = threeSymbols[0] === '🦔' ? 8 :
                          threeSymbols[0] === '🏍️' ? 4 :
                          threeSymbols[0] === '🏆' ? 2 : 0;
        if (multiplier > 0) {
          totalWin += betAmount * multiplier;
          for (let j = 0; j < 3; j++) {
            winningPositions.add(col + ((i + j) * GRID_WIDTH));
          }
        }
        break;
      }
    }
  }

  return { totalWin, winningPositions: Array.from(winningPositions) };
};

const SlotMachine = () => {
  const initialReels = Array(GRID_WIDTH * GRID_HEIGHT).fill('🏍️');
  const [reels, setReels] = useState(initialReels);
  const [isSpinning, setIsSpinning] = useState(false);
  const [coins, setCoins] = useState(1000);
  const [betAmount, setBetAmount] = useState(MIN_BET);
  const [lastWin, setLastWin] = useState(0);
  const [hoveredSymbol, setHoveredSymbol] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMuted, setIsMuted] = useState(getMuteState());
  const [winningPositions, setWinningPositions] = useState([]);

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
    
    playSpinSound();
    setIsSpinning(true);
    setCoins(prev => prev - betAmount);
    setLastWin(0);
    setHoveredSymbol(null);
    setWinningPositions([]);

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
        
        const { totalWin, winningPositions } = checkWin(finalReels, betAmount);
        if (totalWin > 0) {
          if (totalWin >= betAmount * 25) {
            playJackpotSound();
          } else {
            playWinSound();
          }
          setLastWin(totalWin);
          setCoins(prev => prev + totalWin);
          setWinningPositions(winningPositions);
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
            className={`reel ${winningPositions.includes(index) ? 'winning' : ''}`}
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
      <button 
        className="mute-button" 
        onClick={async () => {
          const newMuteState = await toggleMute();
          setIsMuted(newMuteState);
        }}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
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
        <div>7+ Hedgehogs: 500x</div>
        <div>6 Hedgehogs: 150x</div>
        <div>5 Hedgehogs: 75x</div>
        <div>4 Hedgehogs: 25x</div>
        <div>3 Hedgehogs: 8x</div>
        <div className="regular-wins">Special Symbol Wins</div>
        <div>5 Hedgehogs: 15x</div>
        <div>5 Sport Bikes: 8x</div>
        <div>5 Trophies: 5x</div>
        <div>4 in a row: 2-10x</div>
        <div>3 special symbols: 2-5x</div>
        <div>4 in column: 2-12x</div>
      </div>
    </div>
  );
};

export default SlotMachine; 