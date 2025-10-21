import React, { useState } from 'react';
import { WLGame, WLRound } from '../../lib/wavelengthApi';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface CluePanelProps {
  game: WLGame;
  currentRound: WLRound | null;
  playerRole: PlayerRole;
  onSubmitClue: (clue: string) => void;
  isLoading?: boolean;
}

const CluePanel: React.FC<CluePanelProps> = ({ game, currentRound, playerRole, onSubmitClue, isLoading = false }) => {
  const [clue, setClue] = useState('');
  const isClueGiver = (playerRole === 'Алина' && game.active_clue_giver === 'A') || 
                      (playerRole === 'Юра' && game.active_clue_giver === 'B');

  const handleSubmit = () => {
    if (clue.trim()) {
      onSubmitClue(clue.trim());
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Clue Phase</h2>
      
      {isClueGiver ? (
        <div className="space-y-4">
          <p className="text-emerald-400">You are giving the clue this round!</p>
          {currentRound?.card && (
            <div className="bg-gray-700 p-4 rounded">
              <p className="text-gray-300 mb-2">
                Card: <strong>{currentRound.card.left_label} ←→ {currentRound.card.right_label}</strong>
              </p>
              <p className="text-gray-400 text-sm">
                Target: <strong>{currentRound.target}</strong> 
                {currentRound.target < 25 && ` (closer to ${currentRound.card.left_label})`}
                {currentRound.target >= 25 && currentRound.target <= 75 && ' (middle range)'}
                {currentRound.target > 75 && ` (closer to ${currentRound.card.right_label})`}
              </p>
            </div>
          )}
          <input
            type="text"
            value={clue}
            onChange={(e) => setClue(e.target.value)}
            placeholder="Enter your clue..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading && clue.trim()) {
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !clue.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Clue</span>
            )}
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">Waiting for {game.active_clue_giver === 'A' ? 'Алина' : 'Юра'} to give a clue...</p>
        </div>
      )}
    </div>
  );
};

export default CluePanel;