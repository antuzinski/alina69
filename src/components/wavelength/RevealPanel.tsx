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

const getScoreText = (delta: number): string => {
  if (delta === 0) return "Идеальное попадание";
  if (delta <= 1) return "Отличное попадание";
  if (delta <= 5) return "Попадание";
  if (delta <= 15) return "🟡 Близко, но не совсем";
  return "Увы, мимо";
};

const getEncouragementText = (delta: number): string => {
  if (delta === 0) return "Невероятно! Точно в цель!";
  if (delta <= 1) return "Потрясающе! Почти идеально!";
  if (delta <= 5) return "Отлично! Вы попали в зону!";
  if (delta <= 15) return "Неплохо! Совсем рядом с целью.";
  return "Не расстраивайтесь, в следующий раз получится лучше!";
};

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
              <div className="text-center">
                <p className="text-emerald-400 text-lg mb-2">
                  <strong>{getScoreText(currentRound.delta || 0)}</strong>
                </p>
                <p className="text-gray-400 text-sm">
                  Target: {currentRound.target}, Your guess: {currentRound.guess}, Difference: {currentRound.delta}
                </p>
              </div>
            )}
          </div>
        )}
        
        <div className="text-center">
          <p className="text-gray-300 mb-4">
            {currentRound?.delta !== null && getEncouragementText(currentRound.delta)}
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