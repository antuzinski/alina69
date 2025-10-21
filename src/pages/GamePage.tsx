import React from 'react';
// Временно отключаем все импорты, которые могут вызывать getItems
// import { useWavelengthGame } from '../hooks/useWavelengthGame';
// import { usePlayerRole } from '../hooks/usePlayerRole';
// import RoleChip from '../components/wavelength/RoleChip';
// import PrepPanel from '../components/wavelength/PrepPanel';
// import CluePanel from '../components/wavelength/CluePanel';
// import GuessPanel from '../components/wavelength/GuessPanel';
// import RevealPanel from '../components/wavelength/RevealPanel';
// import BestShots from '../components/wavelength/BestShots';

const GamePage: React.FC = () => {
  // Временно убираем все хуки, которые могут дергать старый API
  console.log('[GAME] GamePage mounted - диагностика сети');

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Wavelength</h1>
          <div className="text-gray-400 text-sm">Диагностика сети...</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-4xl mx-auto pb-20">
        <div className="bg-gray-800 rounded-lg p-8">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Диагностика подключения</h2>
          <div className="space-y-4 text-gray-300">
            <p>1. Проверяем env переменные в консоли браузера</p>
            <p>2. Тестируем REST endpoint Supabase</p>
            <p>3. Изолируем игру от старого API</p>
            <div className="mt-6 p-4 bg-gray-700 rounded">
              <p className="text-sm text-gray-400">
                Откройте DevTools → Console для просмотра диагностики
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GamePage;