// import { useWavelengthGame } from '../hooks/useWavelengthGame';
// import { usePlayerRole } from '../hooks/usePlayerRole';
// import RoleChip from '../components/wavelength/RoleChip';
// import PrepPanel from '../components/wavelength/PrepPanel';
// import CluePanel from '../components/wavelength/CluePanel';
// import GuessPanel from '../components/wavelength/GuessPanel';
// import RevealPanel from '../components/wavelength/RevealPanel';
// import BestShots from '../components/wavelength/BestShots';
// import BestShots from '../components/wavelength/BestShots';

const GamePage: React.FC = () => {
  // const { game, isLoading, error } = useWavelengthGame();
  // const { playerRole, switchRole } = usePlayerRole();

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-900 flex items-center justify-center">
  //       <div className="text-gray-400">Loading game...</div>
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <div className="min-h-screen bg-gray-900 flex items-center justify-center">
  //       <div className="text-red-400">Error loading game: {error.message}</div>
  //     </div>
  //   );
  // }

  // const renderGamePanel = () => {
  //   if (!game) return <PrepPanel />;

  //   switch (game.phase) {
  //     case 'ROUND_PREP':
  //       return <PrepPanel game={game} playerRole={playerRole} />;
  //     case 'CLUE_PHASE':
  //       return <CluePanel game={game} playerRole={playerRole} />;
  //     case 'GUESS_PHASE':
  //       return <GuessPanel game={game} playerRole={playerRole} />;
  //     case 'REVEAL':
  //       return <RevealPanel game={game} playerRole={playerRole} />;
  //     default:
  //       return <PrepPanel />;
  //   }
  // };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Wavelength</h1>
          <div className="text-sm text-gray-400">Coming soon...</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-4xl mx-auto pb-20">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-emerald-500 mb-4">Wavelength Game</h2>
          <p className="text-gray-400 mb-6">
            A two-player guessing game where one player gives clues and the other tries to guess where concepts fall on a spectrum.
          </p>
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-300">
              Game implementation in progress...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};


export default GamePage