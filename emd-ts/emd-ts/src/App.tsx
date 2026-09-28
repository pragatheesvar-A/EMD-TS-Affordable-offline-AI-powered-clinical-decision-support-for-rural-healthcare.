import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { PatientRegistration } from './pages/PatientRegistration';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { AIScreening } from './pages/AIScreening';
import { PatientTimeline } from './pages/PatientTimeline';
import { ClinicalCopilot } from './pages/ClinicalCopilot';
import { SmartReferral } from './pages/SmartReferral';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { SecurityCenter } from './pages/SecurityCenter';
import { BlockchainAudit } from './pages/BlockchainAudit';
import { Architecture } from './pages/Architecture';
import { BusinessModel } from './pages/BusinessModel';
import { Settings } from './pages/Settings';
import { DoctorConsultationPayment } from './pages/DoctorConsultationPayment';
import { DemoRunner } from './pages/DemoRunner';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/registration" element={<PatientRegistration />} />
              <Route path="/monitoring" element={<LiveMonitoring />} />
              <Route path="/screening" element={<AIScreening />} />
              <Route path="/timeline" element={<PatientTimeline />} />
              <Route path="/copilot" element={<ClinicalCopilot />} />
              <Route path="/referral" element={<SmartReferral />} />
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/consultation-payment" element={<DoctorConsultationPayment />} />
              <Route path="/security" element={<SecurityCenter />} />
              <Route path="/blockchain" element={<BlockchainAudit />} />
              <Route path="/architecture" element={<Architecture />} />
              <Route path="/business" element={<BusinessModel />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/demo" element={<DemoRunner />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Layout>
        </HashRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
