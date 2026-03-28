import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Register from "./pages/Register";
import SubmitProject from "./pages/SubmitProject";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import VerifyCertificate from "./pages/VerifyCertificate";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin-login" replace />;
};

const StudentProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('studentToken');
  return token ? children : <Navigate to="/student-login" replace />;
};

function AppContent() {
  const location = useLocation();
  const isDashboard = ['/admin', '/admin-login', '/portal'].some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-zinc-950">
      {!isDashboard && <Navbar />}
      <div className={!isDashboard ? "pt-28" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/submit-project" element={<SubmitProject />} />
          <Route path="/register" element={<Register />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/portal" element={<StudentProtectedRoute><StudentDashboard /></StudentProtectedRoute>} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/verify/:studentId" element={<VerifyCertificate />} />
        </Routes>
      </div>
      {!isDashboard && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <AppContent />
    </Router>
  );
}

export default App;
