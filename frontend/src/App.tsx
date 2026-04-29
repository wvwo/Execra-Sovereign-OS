import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UploadPage } from './pages/UploadPage';
import { WorkflowEditor } from './pages/WorkflowEditor';
import { ExecutionPage } from './pages/ExecutionPage';
import { RunMonitorPage } from './pages/RunMonitorPage';
import { AuditPage } from './pages/AuditPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { VariablesPage } from './pages/VariablesPage';
import { SchedulePage } from './pages/SchedulePage';
import { LiveCapturePage } from './pages/LiveCapturePage';
import { PrivacyShieldPage } from './pages/PrivacyShieldPage';
import { TriggerManagerPage } from './pages/TriggerManagerPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated app shell */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<WorkflowsPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/editor/:id" element={<WorkflowEditor />} />
            <Route path="/execute/:id" element={<ExecutionPage />} />
            <Route path="/run/:id" element={<RunMonitorPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/variables" element={<VariablesPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/live-capture" element={<LiveCapturePage />} />
            <Route path="/privacy-shield" element={<PrivacyShieldPage />} />
            <Route path="/triggers" element={<TriggerManagerPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
