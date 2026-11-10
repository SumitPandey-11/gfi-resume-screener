import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Results from './pages/Results';
import JobDescriptions from './pages/JobDescriptions';
import CandidateDetails from './pages/CandidateDetails';
import Reports from './pages/Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="jobs" element={<JobDescriptions />} />
          <Route path="results" element={<Results />} />
          <Route path="reports" element={<Reports />} />
          
          {/* This is the correct syntax for the candidate route */}
          <Route path="candidate/:id" element={<CandidateDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;