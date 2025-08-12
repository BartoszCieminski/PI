import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Twoje komponenty:
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Classes from './pages/Classes';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer"
            element={
              <ProtectedRoute requiredRole="trainer">
                <TrainerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
