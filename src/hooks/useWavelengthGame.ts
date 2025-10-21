import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wavelengthApi, WLGame, WLRound } from '../lib/wavelengthApi';

export interface WavelengthGameState {
  game: WLGame | null;
  currentRound: WLRound | null;
  isLoading: boolean;
  error: Error | null;
}

export const useWavelengthGame = () => {
  const queryClient = useQueryClient();

  // Get game state
  const { data: game, isLoading: gameLoading, error: gameError } = useQuery({
    queryKey: ['wavelength-game'],
    queryFn: wavelengthApi.getGame,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 5 * 1000, // Refresh every 5 seconds
    retry: 3,
  });

  // Get current round
  const { data: currentRound, isLoading: roundLoading } = useQuery({
    queryKey: ['wavelength-current-round', game?.current_round_index],
    queryFn: () => wavelengthApi.getCurrentRound(),
    enabled: !!game && game.current_round_index > 0,
    staleTime: 30 * 1000,
    retry: 3,
  });

  // Mutations for game actions
  const startRoundMutation = useMutation({
    mutationFn: () => wavelengthApi.startNewRound(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wavelength-game'] });
      queryClient.invalidateQueries({ queryKey: ['wavelength-current-round'] });
    },
  });

  const submitClueMutation = useMutation({
    mutationFn: (clue: string) => wavelengthApi.submitClue(clue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wavelength-game'] });
      queryClient.invalidateQueries({ queryKey: ['wavelength-current-round'] });
    },
  });

  const lockGuessMutation = useMutation({
    mutationFn: (guess: number) => wavelengthApi.lockGuess(guess),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wavelength-game'] });
      queryClient.invalidateQueries({ queryKey: ['wavelength-current-round'] });
    },
  });

  const backToPrepMutation = useMutation({
    mutationFn: () => wavelengthApi.backToPrep(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wavelength-game'] });
      queryClient.invalidateQueries({ queryKey: ['wavelength-current-round'] });
    },
  });

  const isLoading = gameLoading || roundLoading;
  const error = gameError as Error | null;

  // Action functions
  const startNewRound = async () => {
    console.log('[WAVELENGTH] Starting new round via API');
    return startRoundMutation.mutateAsync();
  };

  const submitClue = async (clue: string) => {
    console.log('[WAVELENGTH] Submitting clue via API:', clue);
    return submitClueMutation.mutateAsync(clue);
  };

  const lockGuess = async (guess: number) => {
    console.log('[WAVELENGTH] Locking guess via API:', guess);
    return lockGuessMutation.mutateAsync(guess);
  };

  const backToPrep = async () => {
    console.log('[WAVELENGTH] Going back to prep via API');
    return backToPrepMutation.mutateAsync();
  };

  return { 
    game, 
    currentRound,
    isLoading, 
    error,
    startNewRound,
    submitClue,
    lockGuess,
    backToPrep,
    // Mutation states for UI feedback
    isStartingRound: startRoundMutation.isPending,
    isSubmittingClue: submitClueMutation.isPending,
    isLockingGuess: lockGuessMutation.isPending,
    isGoingToPrep: backToPrepMutation.isPending,
  };
};