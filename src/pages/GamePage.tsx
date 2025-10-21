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
  const { game, isLoading, error, updateGameState } = useWavelengthGame();
  const { playerRole, switchRole } = usePlayerRole();

  console.log('[GAME] GamePage mounted - isolated from old API');
  console.log('[GAME] Current game state:', game);

  // Шаг 3: Локальные переходы стейт-машины
  const handleStartRound = () => {
    if (!game) return;
    
    console.log('[WAVELENGTH] Local transition: ROUND_PREP → CLUE_PHASE');
    updateGameState({
      phase: 'CLUE_PHASE',
      current_round_index: game.current_round_index + 1,
      active_clue_giver: game.active_clue_giver === 'A' ? 'B' : 'A'
    });
  };

  const handleSubmitClue = () => {
    console.log('[WAVELENGTH] Local transition: CLUE_PHASE → GUESS_PHASE');
    updateGameState({ phase: 'GUESS_PHASE' });
  };

  const handleLockGuess = () => {
    console.log('[WAVELENGTH] Local transition: GUESS_PHASE → REVEAL');
    updateGameState({ phase: 'REVEAL' });
  };

  const handleBackToPrep = () => {
    console.log('[WAVELENGTH] Local transition: REVEAL → ROUND_PREP');
    updateGameState({ phase: 'ROUND_PREP' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-gray-400">Loading game...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-red-400">Error loading game: {error?.message}</div>
      </div>
    );
  }

  const renderMainPanel = () => {
    switch (game.phase) {
      case 'ROUND_PREP':
        return <PrepPanel game={game} playerRole={playerRole} onStartRound={handleStartRound} />;
      case 'CLUE_PHASE':
        return <CluePanel game={game} playerRole={playerRole} onSubmitClue={handleSubmitClue} />;
      case 'GUESS_PHASE':
        return <GuessPanel game={game} playerRole={playerRole} onLockGuess={handleLockGuess} />;
      case 'REVEAL':
        return <RevealPanel game={game} playerRole={playerRole} onBackToPrep={handleBackToPrep} />;
      default:
        return <div className="text-red-400">Unknown game phase: {game.phase}</div>;
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
            {renderMainPanel()}
          </div>
          
          {/* Right Rail */}
          <div className="lg:col-span-1">
            <BestShots />
          </div>
        </div>
        
        {/* Debug Info */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Debug Info (Step 3 - Local State Machine)</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Phase: <span className="text-emerald-400">{game.phase}</span></div>
            <div>Round: <span className="text-emerald-400">{game.current_round_index}</span></div>
            <div>Active Clue Giver: <span className="text-emerald-400">Player {game.active_clue_giver}</span></div>
            <div>Your Role: <span className="text-emerald-400">Player {playerRole}</span></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GamePage;