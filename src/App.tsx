
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { FindTherapist } from './pages/FindTherapist';
import { TherapistDashboardHome } from './pages/TherapistDashboardHome';
import { Layout } from './components/Layout';
import { DashboardHome } from './pages/DashboardHome';
import { Profile } from './pages/Profile';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Journal } from './pages/Journal';
import { Curriculum } from './pages/Curriculum';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/therapist-dashboard" element={<TherapistDashboardHome />} />
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/find-therapist" element={<FindTherapist />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/curriculum" element={<Curriculum />} />
              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
