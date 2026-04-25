import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UploadPage } from './pages/UploadPage';
import { WorkflowEditor } from './pages/WorkflowEditor';
import { ExecutionPage } from './pages/ExecutionPage';
import { AuditPage } from './pages/AuditPage';
import { WorkflowsPage } from './pages/WorkflowsPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<WorkflowsPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/editor/:id" element={<WorkflowEditor />} />
            <Route path="/execute/:id" element={<ExecutionPage />} />
            <Route path="/audit" element={<AuditPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

