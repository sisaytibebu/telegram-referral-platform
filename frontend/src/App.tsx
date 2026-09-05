/**
 * App root — router will expand significantly in later phases.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HealthCheck from '@/pages/HealthCheck';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Phase 1: health-check page */}
        <Route path="/" element={<HealthCheck />} />

        {/* Phases 9+: admin dashboard routes will be added here */}
        {/* <Route path="/login"      element={<Login />} /> */}
        {/* <Route path="/dashboard"  element={<Dashboard />} /> */}

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
