import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  Wallet,
  CheckSquare,
  FolderKanban,
  Building2,
  Target,
  Star,
  Monitor,
  Receipt,
  Megaphone,
  LifeBuoy,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Employees', path: '/employees', icon: Users, roles: ['ADMIN', 'HR'] },
  { label: 'Attendance', path: '/attendance', icon: Clock },
  { label: 'Leave', path: '/leave', icon: Calendar },
  { label: 'Calendar', path: '/calendar', icon: Calendar },
  { label: 'Payroll', path: '/payroll', icon: Wallet },
  { label: 'Tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Clients', path: '/clients', icon: Building2, roles: ['ADMIN', 'HR'] },
  { label: 'Recruitment', path: '/recruitment', icon: Target, roles: ['ADMIN', 'HR'] },
  { label: 'Performance', path: '/performance', icon: Star },
  { label: 'Assets', path: '/assets', icon: Monitor, roles: ['ADMIN', 'HR'] },
  { label: 'Expenses', path: '/expenses', icon: Receipt },
  { label: 'Announcements', path: '/announcements', icon: Megaphone },
  { label: 'Helpdesk', path: '/helpdesk', icon: LifeBuoy },
  { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'HR'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },
  { label: 'Roles & Permissions', path: '/settings/roles', icon: Shield, roles: ['ADMIN'] },
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, role, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full bg-primary-500 dark:bg-primary-900 z-50
          transition-all duration-300 ease-in-out
          ${sidebarWidth}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <img src="/logo_main.png" alt="PRSECURITY" className="w-8 h-8 rounded-lg object-contain" />
                <div>
                  <h1 className="text-white font-bold text-sm leading-tight">
                    PRSECURITY
                  </h1>
                  <p className="text-accent text-xs">HRMS Portal</p>
                </div>
              </div>
            )}
            {isCollapsed && (
              <img src="/logo_main.png" alt="PRSECURITY" className="w-8 h-8 rounded-lg object-contain mx-auto" />
            )}
            <button
              onClick={onClose}
              className="lg:hidden text-white hover:text-accent transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                    ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-gray-300 hover:bg-primary-600 dark:hover:bg-primary-800 hover:text-white'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-primary-600 p-3">
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-semibold text-sm">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-gray-400 text-xs truncate">{user?.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={logout}
                className="w-full flex items-center justify-center text-gray-400 hover:text-white transition-colors p-2"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center p-2 border-t border-primary-600 text-gray-400 hover:text-white transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
