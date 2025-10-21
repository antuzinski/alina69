import React from 'react';
import { Bug } from 'lucide-react';
import { useWavelengthGame } from '../hooks/useWavelengthGame';
import { useQuery } from '@tanstack/react-query';
import { wavelengthApi } from '../lib/wavelengthApi';
import { usePlayerRole } from '../hooks/usePlayerRole';
import RoleChip from '../components/wavelength/RoleChip';
import PrepPanel from '../components/wavelength/PrepPanel';
import CluePanel from '../components/wavelength/CluePanel';
import GuessPanel from '../components/wavelength/GuessPanel';
import RevealPanel from '../components/wavelength/RevealPanel';
import BestShots from '../components/wavelength/BestShots';

const GamePage: React.FC = () => {
  const { 
    game, 
    currentRound, 
    isLoading, 
    error, 
    startNewRound,
    submitClue,
    lockGuess,
    backToPrep,
    isStartingRound,
    isSubmittingClue,
    isLockingGuess,
    isGoingToPrep
  } = useWavelengthGame();
  const { playerRole, switchRole, autoSwitch, toggleAutoSwitch } = usePlayerRole(game);
  const [debugMode, setDebugMode] = React.useState(false);

  // Get best shots for sidebar
  const { data: bestShots } = useQuery({
    queryKey: ['wavelength-best-shots'],
    queryFn: wavelengthApi.getBestShots,
    staleTime: 60 * 1000, // 1 minute
  });

  console.log('[GAME] GamePage mounted - real Supabase integration');
  console.log('[GAME] Current game state:', game);
  console.log('[GAME] Current round:', currentRound);

  // Action handlers
  const handleStartRound = async () => {
    try {
      await startNewRound();
    } catch (error) {
      console.error('[GAME] Error starting round:', error);
    }
  };

  const handleSubmitClue = async (clue: string) => {
    try {
      await submitClue(clue);
    } catch (error) {
      console.error('[GAME] Error submitting clue:', error);
    }
  };

  const handleLockGuess = async (guess: number) => {
    try {
      await lockGuess(guess);
    } catch (error) {
      console.error('[GAME] Error locking guess:', error);
    }
  };

  const handleBackToPrep = async () => {
    try {
      await backToPrep();
    } catch (error) {
      console.error('[GAME] Error going to prep:', error);
    }
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
        return <PrepPanel game={game} playerRole={playerRole} onStartRound={handleStartRound} isLoading={isStartingRound} />;
      case 'CLUE_PHASE':
        return <CluePanel game={game} currentRound={currentRound} playerRole={playerRole} onSubmitClue={handleSubmitClue} isLoading={isSubmittingClue} />;
      case 'GUESS_PHASE':
        return <GuessPanel game={game} currentRound={currentRound} playerRole={playerRole} onLockGuess={handleLockGuess} isLoading={isLockingGuess} />;
      case 'REVEAL':
        return <RevealPanel game={game} currentRound={currentRound} playerRole={playerRole} onBackToPrep={handleBackToPrep} isLoading={isGoingToPrep} />;
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
          <div className="flex items-center space-x-3">
            <RoleChip 
              playerRole={playerRole} 
              onSwitchRole={switchRole}
              autoSwitch={autoSwitch}
              onToggleAutoSwitch={toggleAutoSwitch}
              debugMode={debugMode}
            />
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`p-2 rounded transition-colors ${
                debugMode 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
              title="Toggle debug mode"
            >
              <Bug className="w-4 h-4" />
            </button>
          </div>
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
            <BestShots bestShots={bestShots} />
          </div>
        </div>
        
        {/* Debug Info */}
        {debugMode && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Debug Info</h3>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Phase: <span className="text-emerald-400">{game.phase}</span></div>
              <div>Round: <span className="text-emerald-400">{game.current_round_index}</span></div>
              <div>Active Clue Giver: <span className="text-emerald-400">{game.active_clue_giver === 'A' ? 'Алина' : 'Юра'}</span></div>
              <div>Your Role: <span className="text-emerald-400">{playerRole}</span></div>
              {currentRound && (
                <>
                  <div>Card: <span className="text-emerald-400">{currentRound.card?.left_label} ←→ {currentRound.card?.right_label}</span></div>
                  <div>Target: <span className="text-emerald-400">{currentRound.target}</span></div>
                  {currentRound.clue && <div>Clue: <span className="text-emerald-400">"{currentRound.clue}"</span></div>}
                  {currentRound.guess !== null && <div>Guess: <span className="text-emerald-400">{currentRound.guess}</span></div>}
                  {currentRound.score !== null && <div>Score: <span className="text-emerald-400">{currentRound.score}</span></div>}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GamePage;