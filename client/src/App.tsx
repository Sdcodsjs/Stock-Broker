import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { useTradeStore } from './stores/useTradeStore';
import type { User, StockMap } from './types';
import './index.css';

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const user = useTradeStore(state => state.user);
  const location = useLocation();

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (user && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const navigate = useNavigate();
  const { 
    theme, 
    toggleTheme, 
    setSession, 
    logout 
  } = useTradeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleLogin = (u: User, stocksList: string[], meta: Record<string, any>, prices: StockMap) => {
    // Save to Zustand
    setSession(
      u, 
      stocksList, 
      meta, 
      u.balance || 100000, 
      u.portfolio || {}, 
      u.subscriptions || [], 
      prices
    );
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <NavigationGuard>
            <LoginPage 
              onLogin={handleLogin} 
              theme={theme} 
              onToggleTheme={toggleTheme} 
            />
          </NavigationGuard>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <NavigationGuard>
            <Dashboard 
              pageType="home" 
              onLogout={handleLogout} 
            />
          </NavigationGuard>
        } 
      />
      <Route 
        path="/watchlist" 
        element={
          <NavigationGuard>
            <Dashboard 
              pageType="watchlist" 
              onLogout={handleLogout} 
            />
          </NavigationGuard>
        } 
      />
      <Route 
        path="/charts" 
        element={
          <NavigationGuard>
            <Dashboard 
              pageType="charts" 
              onLogout={handleLogout} 
            />
          </NavigationGuard>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <NavigationGuard>
            <Dashboard 
              pageType="profile" 
              onLogout={handleLogout} 
            />
          </NavigationGuard>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <NavigationGuard>
            <Dashboard 
              pageType="settings" 
              onLogout={handleLogout} 
            />
          </NavigationGuard>
        } 
      />
      <Route 
        path="/portfolio" 
        element={
          <NavigationGuard>
            <Dashboard 
              pageType="portfolio" 
              onLogout={handleLogout} 
            />
          </NavigationGuard>
        } 
      />
      <Route 
        path="/admin-portal" 
        element={
          <NavigationGuard>
            <Dashboard 
              pageType="admin" 
              onLogout={handleLogout} 
            />
          </NavigationGuard>
        } 
      />
      <Route 
        path="/portfolio-analytics" 
        element={
          <NavigationGuard>
            <Dashboard 
              pageType="portfolio-analytics" 
              onLogout={handleLogout} 
            />
          </NavigationGuard>
        } 
      />
      <Route 
        path="/price-alerts" 
        element={
          <NavigationGuard>
            <Dashboard 
              pageType="price-alerts" 
              onLogout={handleLogout} 
            />
          </NavigationGuard>
        } 
      />
      <Route 
        path="/system-metrics" 
        element={
          <NavigationGuard>
            <Dashboard 
              pageType="system-metrics" 
              onLogout={handleLogout} 
            />
          </NavigationGuard>
        } 
      />
      <Route 
        path="/architecture" 
        element={
          <NavigationGuard>
            <Dashboard 
              pageType="architecture" 
              onLogout={handleLogout} 
            />
          </NavigationGuard>
        } 
      />
      <Route 
        path="/stock/:ticker" 
        element={
          <NavigationGuard>
            <Dashboard 
              pageType="stock-details" 
              onLogout={handleLogout} 
            />
          </NavigationGuard>
        } 
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
