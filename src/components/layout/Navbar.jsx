import { useState } from 'react';
import { Menu, Bell, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="bg-white shadow-md h-16 flex items-center justify-between px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md hover:bg-gray-100"
      >
        <Menu size={24} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-md hover:bg-gray-100">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
              <User size={16} />
            </div>
            <span className="hidden md:inline">{user?.name || 'User'}</span>
            <ChevronDown size={16} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <a href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-100">
                Profile
              </a>
              <a href="/settings" className="block px-4 py-2 text-sm hover:bg-gray-100">
                Settings
              </a>
              <hr className="my-1" />
              <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;