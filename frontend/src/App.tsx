import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Classes from './pages/Classes';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import TrainerMyTrainings from './pages/TrainerMyTrainings';
import ClientDashboard from './pages/ClientDashboard';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import AdminTrainings from './pages/AdminTrainings';
import AdminEditTraining from './pages/AdminEditTraining';
import AdminAddTraining from './pages/AdminAddTraining'; // ✅ Nowy import
import AdminAddRoom from './pages/AdminAddRoom'; // ⬅️ nowy import
import AdminRooms from './pages/AdminRooms';
import AdminEditRoom from './pages/AdminEditRoom';
import FullCalendarView from './components/FullCalendarView';
import ClientBookings from './pages/ClientBookings'; // ⬅️ import nowej strony
import ClientProfile from './pages/ClientProfile';
import ClientCalendar from './pages/ClientCalendar';
import TrainerHoursReport from './pages/TrainerHoursReport';

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
          <Route path="/calendar" element={<FullCalendarView />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/trainings"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminTrainings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/edit/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminEditTraining />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/add-training"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminAddTraining />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/add-room"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminAddRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rooms"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminRooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/edit-room/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminEditRoom />
              </ProtectedRoute>
            }
          />

          {/* Trainer */}
          <Route
            path="/trainer"
            element={
              <ProtectedRoute requiredRole="trainer">
                <TrainerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/my-trainings"
            element={
              <ProtectedRoute requiredRole="trainer">
                <TrainerMyTrainings />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/trainer/hours-report"
            element={
              <ProtectedRoute requiredRole="trainer">
                <TrainerHoursReport />
              </ProtectedRoute>
            }
          />

          {/* Client */}
          <Route
            path="/client"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/bookings"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/profile"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/calendar"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientCalendar />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
