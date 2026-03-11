import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CursorClaw from "./components/CursorClaw";
import RoleSelection from "./pages/RoleSelection";
import ParticipantRegistration from "./pages/ParticipantRegistration";
import JudgeLogin from "./pages/JudgeLogin";
import JudgeDashboard from "./pages/JudgeDashboard";
import JudgeScoring from "./pages/JudgeScoring";
import Leaderboard from "./pages/Leaderboard";
import { useDeviceType } from "./hooks/useDeviceType";

function App() {
  const { isWeb } = useDeviceType();

  return (
    <>
      {/* 龙虾游标 - 仅在 Web 端显示 */}
      {isWeb && <CursorClaw />}
      <Router>
        <Routes>
          <Route path="/" element={<RoleSelection />} />
          <Route
            path="/participant/register"
            element={<ParticipantRegistration />}
          />
          <Route path="/judge/login" element={<JudgeLogin />} />
          <Route path="/judge/dashboard" element={<JudgeDashboard />} />
          <Route path="/judge/scoring/:teamId" element={<JudgeScoring />} />
          <Route path="/judge/leaderboard" element={<Leaderboard />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
