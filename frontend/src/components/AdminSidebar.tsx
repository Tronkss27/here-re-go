
import { useState } from 'react';
import { 
  House, 
  Calendar, 
  Globe, 
  User, 
  ArrowLeft
} from 'lucide-react';

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: House, label: 'HOME', path: '/admin' },
    { icon: Calendar, label: 'CALENDARIO PARTITE', path: '/admin/calendario' },
    { icon: Globe, label: 'MARKETING', path: '/admin/marketing' },
    { icon: User, label: 'PROFILO', path: '/admin/profilo' }
  ];

  return (
    <div className={`bg-gray-100 border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-18' : 'w-60'
    } h-screen fixed left-0 top-0 z-40`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="font-black text-lg text-gray-900">ADMIN</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-200 transition-colors group ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <item.icon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
            {!isCollapsed && (
              <span className="font-semibold text-sm text-gray-600 group-hover:text-gray-900 uppercase tracking-wide">
                {item.label}
              </span>
            )}
          </a>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
