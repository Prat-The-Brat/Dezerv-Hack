import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import GrpDash from "./components/grp_total_dash"; // Import the group dashboard
import Login from "./components/Login"; // Import the Login component
import Learn from './components/Learn';
import Dashboard from "./components/grp_dash";
import PersonalDash from "./components/personal_dash";
import Chatbot from './components/Chatbot';
import Trade from './components/Trade';

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/grp_dash/:group_name" element={<Dashboard />} />
        <Route path="/personal_dash" element={<PersonalDash />} /> 
        <Route path="/grp_total_dash" element ={<GrpDash/>}/>
        <Route path="/login" element={<Login />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/trade" element={<Trade />} />
      </Routes>
      {!isLandingPage && <Chatbot />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
