import { supabase } from './supabase';

export interface AuthResponse {
  success: boolean;
  error?: string;
}

// Use a fixed email/password for simplicity
const AUTH_EMAIL = 'admin@memorycatalog.local';
const AUTH_PASSWORD = 'deep2924';

export const login = async (password: string): Promise<AuthResponse> => {
  try {
    console.log('[AUTH] Attempting login with password');
    
    if (password !== AUTH_PASSWORD) {
      console.log('[AUTH] Password mismatch');
      return { success: false, error: 'Неверный пароль' };
    }

    console.log('[AUTH] Password correct, signing in with Supabase');
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: AUTH_EMAIL,
      password: AUTH_PASSWORD,
    });

    if (error) {
      console.error('[AUTH] Supabase sign in error:', error);
      
      // If user doesn't exist, try to create them
      if (error.message.includes('Invalid login credentials')) {
        console.log('[AUTH] User not found, attempting to create account');
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: AUTH_EMAIL,
          password: AUTH_PASSWORD,
        });

        if (signUpError) {
          console.error('[AUTH] Sign up error:', signUpError);
          return { success: false, error: 'Ошибка создания аккаунта' };
        }

        console.log('[AUTH] Account created successfully:', signUpData);
        return { success: true };
      }
      
      return { success: false, error: error.message };
    }

    console.log('[AUTH] Login successful:', data);
    return { success: true };
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return { success: false, error: 'Ошибка входа' };
  }
};

export const logout = async (): Promise<void> => {
  try {
    console.log('[AUTH] Logging out');

    // Sign out from Supabase first (this will handle session cleanup)
    await supabase.auth.signOut();

    console.log('[AUTH] Logout complete, forcing redirect');

    // Force immediate redirect
    window.location.replace('/login');
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    // Force redirect even if logout fails
    window.location.replace('/login');
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AUTH] Session check error:', error);
      return false;
    }
    
    const isAuth = !!session;
    console.log('[AUTH] Authentication check:', isAuth);
    return isAuth;
  } catch (error) {
    console.error('[AUTH] Auth check error:', error);
    return false;
  }
};

export const requireAuth = (): void => {
  // This function will be handled by the ProtectedRoute component
  // We don't need async checks here since the component handles it
};

// Initialize auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[AUTH] Auth state changed:', event, session?.user?.email);

  if (event === 'SIGNED_OUT') {
    console.log('[AUTH] User signed out, redirecting to login');

    // Force redirect if not already on login page
    if (window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  }

  if (event === 'TOKEN_REFRESHED') {
    console.log('[AUTH] Token refreshed successfully');
  }

  if (event === 'SIGNED_IN') {
    console.log('[AUTH] User signed in:', session?.user?.email);
  }
});