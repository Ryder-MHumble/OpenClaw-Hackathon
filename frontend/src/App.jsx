import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CursorClaw from "./components/CursorClaw";
import RoleSelection from "./pages/RoleSelection";
import ParticipantRegistration from "./pages/ParticipantRegistration";
import JudgeLogin from "./pages/JudgeLogin";
import JudgeDashboard from "./pages/JudgeDashboard";
import JudgeScoring from "./pages/JudgeScoring";
import Leaderboard from "./pages/Leaderboard";
import { useIsMobile } from "./utils/deviceDetect";

function App() {
  const isMobile = useIsMobile();

  return (
    <>
      {/* 仅在桌面端（B端）显示龙虾游标 */}
      {!isMobile && <CursorClaw />}
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
          <Route path="*" element={<RoleSelection />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
