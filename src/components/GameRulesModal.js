import React from 'react';
import './GameRulesModal.css';

const GameRulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏍️ Game Rules & Payouts</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="rules-section">
          <h3>🎮 How to Play</h3>
          <ul>
            <li>Set your bet amount using + and - buttons</li>
            <li>Click the "Ride!" button to spin the reels</li>
            <li>Match symbols horizontally or vertically to win</li>
            <li>Collect special hedgehog symbols for jackpot wins</li>
          </ul>
        </div>

        <div className="rules-section">
          <h3>🦔 Lucky Hedgehog Jackpots</h3>
          <div className="payout-grid">
            <div>7+ Hedgehogs</div><div>500x</div>
            <div>6 Hedgehogs</div><div>150x</div>
            <div>5 Hedgehogs</div><div>80x</div>
            <div>4 Hedgehogs</div><div>25x</div>
            <div>3 Hedgehogs</div><div>8x</div>
          </div>
        </div>

        <div className="rules-section">
          <h3>🏆 Special Symbol Wins</h3>
          <div className="payout-grid">
            <div>5 Hedgehogs in a row</div><div>15x</div>
            <div>5 Sport Bikes in a row</div><div>10x</div>
            <div>5 Trophies in a row</div><div>6x</div>
            <div>4 in a row</div><div>2-12x</div>
            <div>3 special symbols</div><div>2-6x</div>
            <div>4 in column</div><div>2-15x</div>
          </div>
        </div>

        <div className="rules-section">
          <h3>🎲 Game Statistics</h3>
          <ul>
            <li>Return to Player (RTP): 90.37%</li>
            <li>Hedgehog Symbol Rarity: 1/24 (4.17%)</li>
            <li>Grid Size: 5x4 (20 positions)</li>
            <li>Bet Range: 10-50 coins</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameRulesModal; 