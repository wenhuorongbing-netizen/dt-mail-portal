import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './core/layout/Shell';
import { ModulePage } from './core/layout/ModulePage';
import { useModules } from './core/modules/modulesRegistry';
import { useAuth } from './lib/auth';
import CustomerLanding from './pages/CustomerLanding';
import HandoverPage from './pages/HandoverPage';
import GuidePage from './pages/GuidePage';
import RulesPage from './pages/RulesPage';
import AdminLogin from './pages/AdminLogin';

function AdminGuard({ modules }: { modules: ReturnType<typeof useModules>['modules'] }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="boot-screen">Loading…</div>;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  const firstRoute = modules[0]?.route ?? '/admin/orders';

  return (
    <Shell modules={modules}>
      <Routes>
        <Route index element={<Navigate to={firstRoute} replace />} />
        {modules.map((module) => (
          <Route key={module.id} path={module.route.replace('/admin/', '')} element={<ModulePage module={module} />} />
        ))}
        <Route path="*" element={<Navigate to={firstRoute} replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  const { modules } = useModules();

  return (
    <Routes>
      <Route path="/" element={<CustomerLanding />} />
      <Route path="/handover/:code" element={<HandoverPage />} />
      <Route path="/guide" element={<GuidePage />} />
      <Route path="/rules" element={<RulesPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/*"
        element={<AdminGuard modules={modules} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
