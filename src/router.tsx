import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services';
import { AppShell } from './components/AppShell';
import Login from './pages/Login';
import Cockpit from './pages/Cockpit';
import Lists from './pages/Lists';
import Dashboard from './pages/Dashboard';
import Support from './pages/Support';
import Administration from './pages/Administration';
import Users from './pages/Users';
import Organization from './pages/Organization';
import Settings from './pages/Settings';
import TopicWorkspace from './pages/TopicWorkspace';
import Audits from './pages/Audits';
import ActivityLog from './pages/ActivityLog';

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const user = authService.getCurrentUser();
    if (!user) return <Navigate to="/login" replace />;
    return <AppShell user={user}>{children}</AppShell>;
};

export const AppRouter = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/app/cockpit" element={<Protected><Cockpit /></Protected>} />
            <Route path="/app/audits" element={<Protected><Audits /></Protected>} />
            <Route path="/app/lists" element={<Protected><Lists /></Protected>} />
            <Route path="/app/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/app/support" element={<Protected><Support /></Protected>} />
            <Route path="/app/admin" element={<Protected><Administration /></Protected>} />
            <Route path="/app/users" element={<Protected><Users /></Protected>} />
            <Route path="/app/organization" element={<Protected><Organization /></Protected>} />
            <Route path="/app/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/app/activity-log" element={<Protected><ActivityLog /></Protected>} />
            <Route path="/app/topic/:id" element={<Protected><TopicWorkspace /></Protected>} />
            <Route path="/app" element={<Navigate to="/app/cockpit" replace />} />
            <Route path="/" element={<Navigate to="/app/cockpit" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </BrowserRouter>
);
