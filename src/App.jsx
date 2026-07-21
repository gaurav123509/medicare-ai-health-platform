import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatbotWidget from './components/ChatbotWidget';
import Loader from './components/Loader';
import Appointment from './pages/Appointment';
import ConsultationRoom from './pages/ConsultationRoom';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import MedicinePriceCompare from './pages/MedicinePriceCompare';
import Profile from './pages/Profile';
import Reminder from './pages/Reminder';
import ReportAnalysis from './pages/ReportAnalysis';
import SOS from './pages/SOS';
import Signup from './pages/Signup';
import SymptomChecker from './pages/SymptomChecker';
import {
  authApi,
  clearSession,
  getStoredToken,
  getStoredUser,
  persistSession,
} from './services/api';

const ProtectedRoute = ({ isAuthenticated, loading, children }) => {
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader label="Preparing your care workspace..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const NotFound = () => (
  <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 text-center">
    <div className="space-y-5">
      <span className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
        Page not found
      </span>
      <h1 className="font-heading text-4xl font-extrabold text-slate-900">
        The page you are looking for does not exist.
      </h1>
      <p className="text-slate-500">
        Try going back to the dashboard to continue using MediCare AI.
      </p>
    </div>
  </div>
);

const App = () => {
  const location = useLocation();
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(getStoredUser());
  const [booting, setBooting] = useState(Boolean(getStoredToken()));

  const isAuthenticated = useMemo(() => Boolean(token), [token]);
  const publicRoutes = ['/', '/login', '/signup'];
  const showAuthenticatedChrome = isAuthenticated && !publicRoutes.includes(location.pathname);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!token) {
        setBooting(false);
        return;
      }

      setBooting(true);
      try {
        const data = await authApi.profile();
        if (isMounted) {
          setUser(data.user);
          persistSession({ token, user: data.user });
        }
      } catch (error) {
        if (isMounted) {
          clearSession();
          setToken('');
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setBooting(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAuthSuccess = (data) => {
    persistSession(data);
    setToken(data.token);
    setUser(data.user);
  };

  const handleLogout = () => {
    clearSession();
    setToken('');
    setUser(null);
  };

  const handleProfileUpdate = (nextUser) => {
    setUser(nextUser);
    persistSession({ token, user: nextUser });
  };

  return (
    <div className="min-h-screen text-slate-800">
      {showAuthenticatedChrome && (
        <Navbar user={user} onLogout={handleLogout} />
      )}

      <Routes>
        <Route
          path="/"
          element={<LandingPage isAuthenticated={isAuthenticated} />}
        />

        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onAuthSuccess={handleAuthSuccess} />}
        />

        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup onAuthSuccess={handleAuthSuccess} />}
        />

        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated} loading={booting}>
              <Dashboard user={user} />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/doctors"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated} loading={booting}>
              <Doctors />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/profile"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated} loading={booting}>
              <Profile user={user} onProfileUpdate={handleProfileUpdate} />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/symptom-checker"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated} loading={booting}>
              <SymptomChecker />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/report-analysis"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated} loading={booting}>
              <ReportAnalysis />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/medicine-price"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated} loading={booting}>
              <MedicinePriceCompare />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/reminder"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated} loading={booting}>
              <Reminder />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/appointment"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated} loading={booting}>
              <Appointment />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/appointment/:id/consultation"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated} loading={booting}>
              <ConsultationRoom />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/sos"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated} loading={booting}>
              <SOS />
            </ProtectedRoute>
          )}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>

      {showAuthenticatedChrome && <ChatbotWidget />}
    </div>
  );
};

export default App;
