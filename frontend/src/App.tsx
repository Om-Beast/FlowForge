import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from '@layouts/RootLayout';
import AuthLayout from '@layouts/AuthLayout';
import DashboardLayout from '@layouts/DashboardLayout';
import ProtectedRoute from '@components/common/ProtectedRoute';

import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';
import DashboardPage from '@pages/dashboard/DashboardPage';
import WorkflowListPage from '@pages/workflows/WorkflowListPage';
import WorkflowBuilderPage from '@pages/workflows/WorkflowBuilderPage';
import MonitoringPage from '@pages/monitoring/MonitoringPage';
import AnalyticsPage from '@pages/analytics/AnalyticsPage';
import LogsPage from '@pages/logs/LogsPage';
import ExecutionDetailPage from '@pages/logs/ExecutionDetailPage';
import SettingsPage from '@pages/settings/SettingsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'auth',
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'workflows', element: <WorkflowListPage /> },
          { path: 'workflows/:id/edit', element: <WorkflowBuilderPage /> },
          { path: 'monitoring', element: <MonitoringPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'logs', element: <LogsPage /> },
          { path: 'logs/executions/:id', element: <ExecutionDetailPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
