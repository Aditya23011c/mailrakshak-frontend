import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { CasesProvider } from './context/CasesContext';
import { TrackerProvider } from './context/ReportTrackerContext';
import FloatingReport from './components/FloatingReport';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';
import Campaigns from './pages/Campaigns';
import Upload from './pages/Upload';
import Login from './pages/Login';
import Landing from './pages/Landing';
import ResetPassword from './pages/ResetPassword';
import Team from './pages/Team';

const STAFF = ['analyst', 'admin', 'superadmin'];
const staff = (el) => <RequireAuth roles={STAFF}>{el}</RequireAuth>;

function Shell() {
  return (
    <RequireAuth>
      <CasesProvider>
        <Layout />
      </CasesProvider>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TrackerProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<Shell />}>
            <Route path="dashboard" element={staff(<Dashboard />)} />
            <Route path="cases/:id" element={staff(<CaseDetail />)} />
            <Route path="campaigns" element={staff(<Campaigns />)} />
            <Route path="upload" element={<Upload />} />
            <Route path="team" element={<RequireAuth roles={['admin', 'superadmin']}><Team /></RequireAuth>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <FloatingReport />
        </TrackerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
