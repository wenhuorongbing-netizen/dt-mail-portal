import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './core/layout/Shell';
import { ModulePage } from './core/layout/ModulePage';
import { useModules } from './core/modules/modulesRegistry';

export default function App() {
  const { modules, loading, error } = useModules();

  if (loading) {
    return <div className="boot-screen">Loading operating desk…</div>;
  }

  if (error) {
    return <div className="boot-screen boot-error">Module registry error: {error}</div>;
  }

  const firstRoute = modules[0]?.route ?? '/example';

  return (
    <Shell modules={modules}>
      <Routes>
        <Route path="/" element={<Navigate to={firstRoute} replace />} />
        {modules.map((module) => (
          <Route key={module.id} path={module.route} element={<ModulePage module={module} />} />
        ))}
        <Route path="*" element={<Navigate to={firstRoute} replace />} />
      </Routes>
    </Shell>
  );
}
