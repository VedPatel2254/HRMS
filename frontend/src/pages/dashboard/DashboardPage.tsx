import { useAuth } from '../../hooks/useAuth';
import AdminDashboardPage from './AdminDashboardPage';
import EmployeeDashboardPage from './EmployeeDashboardPage';

const DashboardPage = () => {
  const { isAdmin, isHR } = useAuth();

  if (isAdmin || isHR) {
    return <AdminDashboardPage />;
  }

  return <EmployeeDashboardPage />;
};

export default DashboardPage;
