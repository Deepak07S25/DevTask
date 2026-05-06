import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import Backlog from "./pages/Backlog";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute";

import { ToastProvider } from "./design-system/Toast";
import { ConfirmProvider } from "./design-system/Confirm";

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Router>
      <Routes>
        <Route path="/"                     element={<Home />} />
        <Route path="/register"             element={<Register />} />
        <Route path="/login"                element={<Login />} />
        <Route path="/dashboard"            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/project/:id"          element={<ProtectedRoute><Board /></ProtectedRoute>} />
        <Route path="/project/:id/backlog"  element={<ProtectedRoute><Backlog /></ProtectedRoute>} />
        <Route path="/profile"              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/notifications"        element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="*"                     element={<NotFoundPage />} />
      </Routes>
    </Router>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
