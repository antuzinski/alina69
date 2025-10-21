import React, { useState } from 'react';
import { WLGame, WLRound } from '../../lib/wavelengthApi';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface GuessPanelProps {
  game: WLGame;
  currentRound: WLRound | null;
  playerRole: PlayerRole;
  onLockGuess: (guess: number) => void;
  isLoading?: boolean;
}

const GuessPanel: React.FC<GuessPanelProps> = ({ game, currentRound, playerRole, onLockGuess, isLoading = false }) => {
  const [guess, setGuess] = useState(50);
  const isGuesser = playerRole !== game.active_clue_giver;

  const handleLockGuess = () => {
    onLockGuess(guess);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Guess Phase</h2>
      
      <div className="space-y-4">
        {currentRound?.card && (
          <div className="bg-gray-700 p-4 rounded">
            <p className="text-gray-300 mb-2">
              Card: <strong>{currentRound.card.left_label} ←→ {currentRound.card.right_label}</strong>
            </p>
            {currentRound.clue && (
              <p className="text-emerald-400 mb-2">
                Clue: <strong>"{currentRound.clue}"</strong>
              </p>
            )}
          </div>
        )}
        
        {isGuesser ? (
          <div className="space-y-4">
            <p className="text-emerald-400">Your turn to guess!</p>
            <div className="space-y-2">
              <label className="text-gray-300 text-sm">Where on the spectrum? (0-100)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={guess}
                onChange={(e) => setGuess(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
                disabled={isLoading}
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{currentRound?.card?.left_label || 'Left'} (0)</span>
                <span className="text-emerald-400 font-bold text-lg">{guess}</span>
                <span>{currentRound?.card?.right_label || 'Right'} (100)</span>
              </div>
            </div>
            <button
              onClick={handleLockGuess}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Locking...</span>
                </>
              ) : (
                <span>Lock Guess</span>
              )}
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