import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleSelection from "./pages/RoleSelection";
import JudgeLogin from "./pages/JudgeLogin";
import JudgeDashboard from "./pages/JudgeDashboard";
import JudgeScoring from "./pages/JudgeScoring";
import Leaderboard from "./pages/Leaderboard";
import JudgeRoadshowScoring from "./pages/JudgeRoadshowScoring";
import FinalistGallery from "./pages/FinalistGallery";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/judge/login" element={<JudgeLogin />} />
        <Route
          path="/judge/dashboard"
          element={
            <ProtectedRoute>
              <JudgeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/judge/scoring/:teamId"
          element={
            <ProtectedRoute>
              <JudgeScoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/judge/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/judge/roadshow-scoring"
          element={
            <ProtectedRoute>
              <JudgeRoadshowScoring />
            </ProtectedRoute>
          }
        />
        <Route path="/finalists" element={<FinalistGallery />} />
        <Route path="*" element={<RoleSelection />} />
      </Routes>
    </Router>
  );
}

export default App;
