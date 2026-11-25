import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useUserStore } from './store';
import Layout from './components/layout/Layout';
import OnboardingFlow from './components/onboarding/OnboardingFlow';

// Pages
import DashboardPage from './pages/DashboardPage';
import AQIMonitorPage from './pages/AQIMonitorPage';
import RoutinePlannerPage from './pages/RoutinePlannerPage';
import IndoorAdvisorPage from './pages/IndoorAdvisorPage';
import SustainableChoicesPage from './pages/SustainableChoicesPage';
import AIAssistantPage from './pages/AIAssistantPage';
import SimulatorPage from './pages/SimulatorPage';
import ProgressPage from './pages/ProgressPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const profile = useUserStore((s) => s.profile);
  const needsOnboarding = !profile?.onboardingComplete;

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#16653a', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
        }}
      />

      {needsOnboarding ? (
        <OnboardingFlow />
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/aqi" element={<AQIMonitorPage />} />
            <Route path="/routine" element={<RoutinePlannerPage />} />
            <Route path="/indoor" element={<IndoorAdvisorPage />} />
            <Route path="/sustainable" element={<SustainableChoicesPage />} />
            <Route path="/ai" element={<AIAssistantPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  );
}
