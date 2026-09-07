import { ReactNode, isValidElement } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ActionObject {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  action?: ReactNode | ActionObject;
}

const isActionObject = (action: ReactNode | ActionObject): action is ActionObject => {
  return typeof action === 'object' && action !== null && !isValidElement(action) && 'label' in action;
};

const PageHeader = ({ title, subtitle, breadcrumbs, actions, action }: PageHeaderProps) => {
  const renderAction = (act: ReactNode | ActionObject) => {
    if (isActionObject(act)) {
      const Icon = act.icon;
      const content = (
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          {act.label}
        </span>
      );
      if (act.href) {
        return (
          <Link
            to={act.href}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            {content}
          </Link>
        );
      }
      return (
        <button
          onClick={act.onClick}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          {content}
        </button>
      );
    }
    return act;
  };

  const actionContent = action || actions;

  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-3 h-3" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="hover:text-accent transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-900 dark:text-white">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {actionContent && <div className="flex items-center gap-3">{isActionObject(actionContent) ? renderAction(actionContent) : actionContent}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
