import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Dashboard' },
  ];

  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-gray-50">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-700">FPS</h2>
      </div>
      <nav className="flex-1 px-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`block rounded px-3 py-2 text-sm ${
              location.pathname === link.to
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
