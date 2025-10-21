import React from 'react';
import { WLGame, WLRound } from '../../lib/wavelengthApi';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface RevealPanelProps {
  game: WLGame;
  currentRound: WLRound | null;
  playerRole: PlayerRole;
  onBackToPrep: () => void;
  isLoading?: boolean;
}

const RevealPanel: React.FC<RevealPanelProps> = ({ game, currentRound, playerRole, onBackToPrep, isLoading = false }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Reveal Phase</h2>
      
      <div className="space-y-6">
        {currentRound?.card && (
          <div className="bg-gray-700 p-4 rounded">
            <p className="text-gray-300 mb-2">
              Card: <strong>{currentRound.card.left_label} ←→ {currentRound.card.right_label}</strong>
            </p>
            {currentRound.clue && (
              <p className="text-gray-400 mb-2">Clue: <strong>"{currentRound.clue}"</strong></p>
            )}
            {currentRound.guess !== null && (
              <p className="text-gray-400 mb-2">Guess: <strong>{currentRound.guess}</strong></p>
            )}
            <p className="text-gray-400 mb-2">Target: <strong>{currentRound.target}</strong></p>
            {currentRound.score !== null && currentRound.delta !== null && (
              <p className="text-emerald-400 text-lg">
                Score: <strong>{currentRound.score} points</strong> (Δ = {currentRound.delta})
              </p>
            )}
          </div>
        )}
        
        <div className="text-center">
          <p className="text-gray-300 mb-4">
            {currentRound?.delta !== null && (
              currentRound.delta <= 5 ? "Excellent! Very close to the target." :
              currentRound.delta <= 15 ? "Good guess! Pretty close." :
              currentRound.delta <= 30 ? "Not bad, getting warmer." :
              "Keep trying! You'll get closer next time."
            )}
          </p>
          <button
            onClick={onBackToPrep}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition-colors flex items-center space-x-2 mx-auto"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Preparing...</span>
              </>
            ) : (
              <span>Next Round</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevealPanel;