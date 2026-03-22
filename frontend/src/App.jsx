import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelection from "./pages/RoleSelection";
import ParticipantRegistration from "./pages/ParticipantRegistration";
import FinalistGallery from "./pages/FinalistGallery";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/participant/register" element={<ParticipantRegistration />} />
        <Route path="/finalists" element={<FinalistGallery />} />
        <Route path="*" element={<RoleSelection />} />
      </Routes>
    </Router>
  );
}

export default App;
