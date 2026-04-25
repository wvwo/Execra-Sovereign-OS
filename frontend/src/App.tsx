import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { UploadPage } from './pages/UploadPage';
import { EditorPage } from './pages/EditorPage';
import { ExecutionPage } from './pages/ExecutionPage';
import { AuditPage } from './pages/AuditPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/upload" />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/editor/:id" element={<EditorPage />} />
            <Route path="/execute/:id" element={<ExecutionPage />} />
            <Route path="/audit" element={<AuditPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
