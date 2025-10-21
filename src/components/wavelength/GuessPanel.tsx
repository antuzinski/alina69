import React from 'react';
import { WavelengthGame } from '../../hooks/useWavelengthGame';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface GuessPanelProps {
  game: WavelengthGame;
  playerRole: PlayerRole;
  onLockGuess: () => void;
}

const GuessPanel: React.FC<GuessPanelProps> = ({ game, playerRole, onLockGuess }) => {
  const isGuesser = playerRole !== game.active_clue_giver;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Guess Phase</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-gray-300 mb-2">Card: <strong>Hot ←→ Cold</strong></p>
          <p className="text-emerald-400 mb-2">Clue: <strong>"Summer"</strong></p>
        </div>
        
        {isGuesser ? (
          <div className="space-y-4">
            <p className="text-emerald-400">Your turn to guess!</p>
            <div className="space-y-2">
              <label className="text-gray-300 text-sm">Where on the spectrum? (0-100)</label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="50"
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Cold (0)</span>
                <span>Hot (100)</span>
              </div>
            </div>
            <button
              onClick={onLockGuess}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded transition-colors"
            >
              Lock Guess
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">Waiting for Player {playerRole === 'A' ? 'B' : 'A'} to guess...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuessPanel;