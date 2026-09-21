import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  ConciergeBell,
  Settings,
  Mail,
  MessageSquareText,
  Smartphone,
  MessageSquare,
  Phone,
  CreditCard,
  Landmark,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { useLocation, Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const menuSections = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    ],
  },
  {
    id: 'directory',
    label: 'Directory',
    items: [
      { icon: Users, label: 'Users', path: '/users', match: ['/users', '/user/'] },
      { icon: Building2, label: 'Branches', path: '/branches', match: ['/branches', '/branch/'] },
      { icon: ConciergeBell, label: 'Services', path: '/services' },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    items: [
      {
        icon: Settings,
        label: 'Settings',
        path: '/settings',
        children: [
          { icon: SlidersHorizontal, label: 'Overview', path: '/settings' },
          { icon: Mail, label: 'Company Mail', path: '/settings/mail' },
          {
            icon: MessageSquareText,
            label: 'System WhatsApp',
            path: '/settings/wp-system-templates',
          },
          {
            icon: Smartphone,
            label: 'System SMS Config',
            path: '/settings/sms-system-config',
          },
          {
            icon: MessageSquare,
            label: 'System SMS Templates',
            path: '/settings/sms-system-templates',
          },
          {
            icon: Phone,
            label: 'System Call Config',
            path: '/settings/call-system-config',
          },
          {
            icon: CreditCard,
            label: 'Razorpay',
            path: '/settings/razorpay',
          },
          {
            icon: Landmark,
            label: 'Wallet Payments',
            path: '/settings/wallet-payments',
          },
        ],
      },
    ],
  },
];

const isPathActive = (currentPath, item) => {
  if (item.children?.length) {
    return currentPath === item.path || currentPath.startsWith(`${item.path}/`);
  }
  if (item.path === '/' || item.path === '/dashboard') {
    return currentPath === '/' || currentPath === '/dashboard';
  }
  if (item.match) {
    return item.match.some((m) => currentPath === m || currentPath.startsWith(m));
  }
  return currentPath === item.path || currentPath.startsWith(`${item.path}/`);
};

const isChildActive = (currentPath, child) => {
  if (child.path === '/settings') return currentPath === '/settings';
  return currentPath === child.path || currentPath.startsWith(`${child.path}/`);
};

const Sidebar = ({ isMobile, sidebarOpen, toggleSidebar, onHover, isExpanded }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [collapsedFlyout, setCollapsedFlyout] = useState(null);
  const location = useLocation();
  const currentPath = location.pathname;

  const settingsOpenByRoute = currentPath === '/settings' || currentPath.startsWith('/settings/');
  const [openMenus, setOpenMenus] = useState(() => (settingsOpenByRoute ? { Settings: true } : {}));

  useEffect(() => {
    if (settingsOpenByRoute) {
      setOpenMenus((prev) => ({ ...prev, Settings: true }));
    }
  }, [settingsOpenByRoute]);

  useEffect(() => {
    if (onHover && !isMobile) onHover(isHovered);
  }, [isHovered, onHover, isMobile]);

  const expanded = isMobile ? true : isExpanded;

  useEffect(() => {
    if (expanded) setCollapsedFlyout(null);
  }, [expanded]);

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const itemClass = (active) => `
    relative flex w-full items-center rounded-xl transition-all duration-150
    ${expanded ? 'px-2.5 py-2 gap-2.5' : 'justify-center px-0 py-2'}
    ${active
      ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
      : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100'
    }
  `;

  const iconWrap = (active) =>
    `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
      active
        ? 'bg-white/20 text-white'
        : 'bg-slate-200/80 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
    }`;

  const renderLeaf = (item) => {
    const active = isPathActive(currentPath, item);
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === '/'}
        onClick={() => isMobile && toggleSidebar()}
        title={!expanded ? item.label : ''}
        className={itemClass(active)}
      >
        <span className={iconWrap(active)}>
          <Icon className="h-4 w-4" />
        </span>
        {expanded && (
          <span className={`text-[13px] ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
        )}
      </NavLink>
    );
  };

  const renderChildren = (item, compact = false) => (
    <div className={compact ? 'space-y-0.5 p-1.5' : 'relative ml-5 space-y-0.5 border-l border-slate-200 pl-3 dark:border-slate-700'}>
      {item.children.map((child, index) => {
        const childActive = isChildActive(currentPath, child);
        const ChildIcon = child.icon;
        return (
          <motion.div
            key={child.path}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, delay: index * 0.04, ease: 'easeOut' }}
          >
            <Link
              to={child.path}
              onClick={() => {
                if (isMobile) toggleSidebar();
                setCollapsedFlyout(null);
              }}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] transition-colors ${
                childActive
                  ? 'bg-sky-50 font-semibold text-sky-800 dark:bg-sky-500/15 dark:text-sky-200'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }`}
            >
              <ChildIcon className="h-3.5 w-3.5" />
              {child.label}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );

  const renderParent = (item) => {
    const parentActive = isPathActive(currentPath, item);
    const open = Boolean(openMenus[item.label]);
    const Icon = item.icon;

    if (!expanded) {
      return (
        <div
          key={item.label}
          className="relative"
          onMouseEnter={() => setCollapsedFlyout(item.label)}
          onMouseLeave={() => setCollapsedFlyout(null)}
        >
          <Link
            to={item.path}
            title={item.label}
            onClick={() => isMobile && toggleSidebar()}
            className={itemClass(parentActive)}
          >
            <span className={iconWrap(parentActive)}>
              <Icon className="h-4 w-4" />
            </span>
          </Link>
          {collapsedFlyout === item.label && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-full top-0 z-50 ml-3 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {item.label}
              </p>
              {renderChildren(item, true)}
            </motion.div>
          )}
        </div>
      );
    }

    return (
      <div key={item.label} className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggleMenu(item.label)}
          className={itemClass(parentActive)}
        >
          <span className={iconWrap(parentActive)}>
            <Icon className="h-4 w-4" />
          </span>
          <span className={`flex-1 text-left text-[13px] ${parentActive ? 'font-semibold' : 'font-medium'}`}>
            {item.label}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`} />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-0.5 pb-0.5">
                {renderChildren(item)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const navBody = (
    <nav className={`h-full space-y-5 overflow-y-auto ${expanded ? 'p-2.5' : 'p-1.5'}`}>
      {menuSections.map((section) => (
        <div key={section.id}>
          {expanded && (
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              {section.label}
            </p>
          )}
          <div className="space-y-1">
            {section.items.map((item) => (item.children ? renderParent(item) : renderLeaf(item)))}
          </div>
        </div>
      ))}
    </nav>
  );

  const shell = 'bg-transparent';

  if (isMobile) {
    return (
      <div className={`
        fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-[17.5rem]
        ${shell}
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="m-2 h-[calc(100%-1rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {navBody}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        fixed left-0 top-14 z-20 h-[calc(100vh-3.5rem)]
        transition-all duration-300 ease-out ${shell}
        ${expanded ? 'w-64' : 'w-16'}
      `}
      onMouseEnter={() => {
        if (!isExpanded) {
          setIsHovered(true);
          if (onHover) onHover(true);
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (onHover) onHover(false);
      }}
    >
      <div className={`h-[calc(100%-1rem)] overflow-visible rounded-2xl border border-slate-200/80 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 ${expanded ? 'm-2' : 'm-1.5'}`}>
        {navBody}
      </div>
    </div>
  );
};

export default Sidebar;
