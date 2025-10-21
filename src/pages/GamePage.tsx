import React from 'react';
import { useWavelengthGame } from '../hooks/useWavelengthGame';
import { usePlayerRole } from '../hooks/usePlayerRole';
import RoleChip from '../components/wavelength/RoleChip';
import PrepPanel from '../components/wavelength/PrepPanel';
import CluePanel from '../components/wavelength/CluePanel';
import GuessPanel from '../components/wavelength/GuessPanel';
import RevealPanel from '../components/wavelength/RevealPanel';
import BestShots from '../components/wavelength/BestShots';

const GamePage: React.FC = () => {
  const { game, isLoading, error } = useWavelengthGame();
  const { playerRole, switchRole } = usePlayerRole();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Error loading game: {error.message}</div>
      </div>
    );
  }

  const renderGamePanel = () => {
    if (!game) return <PrepPanel />;

    switch (game.phase) {
      case 'ROUND_PREP':
        return <PrepPanel game={game} playerRole={playerRole} />;
      case 'CLUE_PHASE':
        return <CluePanel game={game} playerRole={playerRole} />;
      case 'GUESS_PHASE':
        return <GuessPanel game={game} playerRole={playerRole} />;
      case 'REVEAL':
        return <RevealPanel game={game} playerRole={playerRole} />;
      default:
        return <PrepPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Wavelength</h1>
          <RoleChip playerRole={playerRole} onSwitchRole={switchRole} />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-4xl mx-auto pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Game Panel */}
          <div className="lg:col-span-3">
            {renderGamePanel()}
          </div>
          
          {/* Right Rail */}
          <div className="space-y-6">
            <BestShots />
          </div>
        </div>
      </main>
    </div>
  );
};

export default GamePage;