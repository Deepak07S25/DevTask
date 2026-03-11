import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import Backlog from "./pages/Backlog";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-sky-500/30">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/project/:id" element={<ProtectedRoute><Board /></ProtectedRoute>} />
          <Route path="/project/:id/backlog" element={<ProtectedRoute><Backlog /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
