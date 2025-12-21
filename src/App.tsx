import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import TextsPage from './pages/TextsPage';
import ImagesPage from './pages/ImagesPage';
import AdminPage from './pages/AdminPage';
import ItemDetailPage from './pages/ItemDetailPage';
import SearchPage from './pages/SearchPage';
import UploadPage from './pages/UploadPage';
import FoldersPage from './pages/FoldersPage';
import ManagePage from './pages/ManagePage';
import EditItemPage from './pages/EditItemPage';
import ChatPage from './pages/ChatPage';
import HomePage from './pages/HomePage';
import { supabase } from './lib/supabase';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      networkMode: 'offlineFirst',
    },
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuth, setIsAuth] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuth(!!session);
      } catch (error) {
        console.error('[AUTH] Session check error:', error);
        setIsAuth(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AUTH] Auth state changed:', event, !!session);
      setIsAuth(!!session);
      
      if (event === 'SIGNED_OUT') {
        setIsAuth(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="home" element={<Navigate to="/" replace />} />
            <Route path="texts" element={<TextsPage />} />
            <Route path="images" element={<ImagesPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="item/:id" element={<ItemDetailPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="admin/upload" element={<UploadPage />} />
            <Route path="admin/folders" element={<FoldersPage />} />
            <Route path="admin/manage" element={<ManagePage />} />
            <Route path="admin/edit/:id" element={<EditItemPage />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
