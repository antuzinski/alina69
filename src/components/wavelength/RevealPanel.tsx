import React from 'react';
import { WavelengthGame } from '../../hooks/useWavelengthGame';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface RevealPanelProps {
  game: WavelengthGame;
  playerRole: PlayerRole;
  onBackToPrep: () => void;
}

const RevealPanel: React.FC<RevealPanelProps> = ({ game, playerRole, onBackToPrep }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Reveal Phase</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-gray-300 mb-2">Card: <strong>Hot ←→ Cold</strong></p>
          <p className="text-gray-400 mb-2">Clue: <strong>"Summer"</strong></p>
          <p className="text-gray-400 mb-2">Guess: <strong>75</strong></p>
          <p className="text-gray-400 mb-2">Target: <strong>78</strong></p>
          <p className="text-emerald-400 text-lg">Score: <strong>97 points</strong> (Δ = 3)</p>
        </div>
        
        <div className="text-center">
          <p className="text-gray-300 mb-4">Great guess! Very close to the target.</p>
          <button
            onClick={onBackToPrep}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded transition-colors"
          >
            Next Round
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevealPanel;