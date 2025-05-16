const SYMBOLS = [
  '🏁', '🏁', '🏁', '🏁', '🏁',  // 5x
  '🔧', '🔧', '🔧', '🔧', '🔧',  // 5x
  '☕️', '☕️', '☕️', '☕️',       // 4x
  '🛵', '🛵', '🛵', '🛵',        // 4x
  '🏆', '🏆', '🏆',              // 3x
  '🏍️', '🏍️',                   // 2x
  '🦔'                           // 1x
];

const GRID_WIDTH = 5;
const GRID_HEIGHT = 4;
const BET_AMOUNT = 10; // Using minimum bet for calculation
const ITERATIONS = 1000000; // 1 million spins for accurate results

function checkWin(reels, betAmount) {
  let totalWin = 0;

  // Check for Hedgehog Jackpot patterns
  const hedgehogCount = reels.filter(symbol => symbol === '🦔').length;
  if (hedgehogCount >= 3) {
    const jackpotMultiplier = {
      3: 8,
      4: 25,
      5: 75,
      6: 150,
      7: 500
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
      const multiplier = rowSymbols[0] === '🦔' ? 15 : 
                        rowSymbols[0] === '🏍️' ? 8 : 
                        rowSymbols[0] === '🏆' ? 5 : 3;
      totalWin += betAmount * multiplier;
      continue;
    }
    
    // Check 4 in a row
    for (let i = 0; i <= 1; i++) {
      const fourSymbols = rowSymbols.slice(i, i + 4);
      if (fourSymbols.every(symbol => symbol === fourSymbols[0])) {
        const multiplier = fourSymbols[0] === '🦔' ? 10 :
                          fourSymbols[0] === '🏍️' ? 5 :
                          fourSymbols[0] === '🏆' ? 3 : 2;
        totalWin += betAmount * multiplier;
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
      const multiplier = colSymbols[0] === '🦔' ? 12 :
                        colSymbols[0] === '🏍️' ? 6 :
                        colSymbols[0] === '🏆' ? 4 : 2;
      totalWin += betAmount * multiplier;
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
        totalWin += betAmount * multiplier;
        break;
      }
    }
  }

  return totalWin;
}

let totalBet = 0;
let totalWin = 0;

// Run simulation
for (let i = 0; i < ITERATIONS; i++) {
  const reels = Array(GRID_WIDTH * GRID_HEIGHT).fill(0).map(() => 
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  );
  
  totalBet += BET_AMOUNT;
  totalWin += checkWin(reels, BET_AMOUNT);
  
  if (i % 100000 === 0) {
    console.log(`Progress: ${(i / ITERATIONS * 100).toFixed(1)}%`);
  }
}

const rtp = (totalWin / totalBet) * 100;
console.log(`\nTotal spins: ${ITERATIONS.toLocaleString()}`);
console.log(`Total bet: ${totalBet.toLocaleString()}`);
console.log(`Total win: ${totalWin.toLocaleString()}`);
console.log(`RTP: ${rtp.toFixed(2)}%`); 