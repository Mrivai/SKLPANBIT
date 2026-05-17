import React, { useEffect, useState } from 'react';
import { VerificationPage } from './components/Verification/VerificationPage';
import { StudentPage } from './components/Student/StudentPage';
import { AdminDashboard } from './components/Admin/AdminDashboard';

export default function App() {
  const [host, setHost] = useState(window.location.hostname);
  const [isDocusign, setIsDocusign] = useState(false);

  useEffect(() => {
    // In dev environment or specific domains
    if (host.includes('docusign') || window.location.search.includes('mode=verify')) {
      setIsDocusign(true);
    } else {
      setIsDocusign(false);
    }
  }, [host]);

  if (isDocusign) {
    return <VerificationPage />;
  }

  return (
    <Router />
  );
}

function Router() {
  const [page, setPage] = useState<'student' | 'admin'>('student');
  
  useEffect(() => {
    // Check URL for admin
    if (window.location.hash === '#admin') {
      setPage('admin');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {page === 'admin' ? <AdminDashboard /> : <StudentPage />}
    </div>
  );
}
