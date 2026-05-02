import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from './i18n/i18n';
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

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App error boundary caught:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#0B0F14] text-white gap-4">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-black text-red-400">Something went wrong</h2>
          <p className="text-slate-400 text-sm max-w-sm text-center">
            {(this.state.error as Error).message}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/dashboard'; }}
            className="mt-4 px-6 py-3 bg-purple-600 rounded-xl font-bold hover:bg-purple-500 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // Apply saved language + theme on first render (no flash)
  useEffect(() => {
    const lang = localStorage.getItem('language') || 'ar';
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  return (
    <ErrorBoundary>
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
            <Route path="/privacy" element={<PrivacyShieldPage />} />
            <Route path="/triggers" element={<TriggerManagerPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
