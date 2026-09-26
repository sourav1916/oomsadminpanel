import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  ConciergeBell,
  Mail,
  MessageSquareText,
  Smartphone,
  MessageSquare,
  Phone,
  CreditCard,
  Landmark,
  LifeBuoy,
  Globe,
  Scale,
  ChevronDown,
  SlidersHorizontal,
  Megaphone,
  Wallet,
} from 'lucide-react';
import { useLocation, Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

/** Flat nav items — no section labels. Settings split into category parents. */
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clients', path: '/users', match: ['/users', '/user/'] },
  { icon: Building2, label: 'Branches', path: '/branches', match: ['/branches', '/branch/'] },
  { icon: ConciergeBell, label: 'Services', path: '/services' },
  {
    icon: Megaphone,
    label: 'Messaging',
    path: '/settings/mail',
    match: [
      '/settings/mail',
      '/settings/wp-system-templates',
      '/settings/sms-system-config',
      '/settings/sms-system-templates',
      '/settings/call-system-config',
    ],
    children: [
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
    ],
  },
  {
    icon: Wallet,
    label: 'Payments',
    path: '/settings/razorpay',
    match: ['/settings/razorpay', '/settings/wallet-payments'],
    children: [
      { icon: CreditCard, label: 'Razorpay', path: '/settings/razorpay' },
      {
        icon: Landmark,
        label: 'Wallet Payments',
        path: '/settings/wallet-payments',
      },
    ],
  },
  {
    icon: Globe,
    label: 'Website',
    path: '/settings/website-contact',
    match: [
      '/settings/website-contact',
      '/settings/website-legal',
      '/settings/help-support',
    ],
    children: [
      {
        icon: Globe,
        label: 'Website Contact',
        path: '/settings/website-contact',
      },
      {
        icon: Scale,
        label: 'Website Legal',
        path: '/settings/website-legal',
      },
      {
        icon: LifeBuoy,
        label: 'Help & Support',
        path: '/settings/help-support',
      },
    ],
  },
  {
    icon: SlidersHorizontal,
    label: 'Settings',
    path: '/settings',
  },
];

const isPathActive = (currentPath, item) => {
  if (item.children?.length) {
    if (item.match) {
      return item.match.some(
        (m) => currentPath === m || currentPath.startsWith(`${m}/`)
      );
    }
    return (
      currentPath === item.path ||
      item.children.some(
        (c) => currentPath === c.path || currentPath.startsWith(`${c.path}/`)
      )
    );
  }
  if (item.path === '/' || item.path === '/dashboard') {
    return currentPath === '/' || currentPath === '/dashboard';
  }
  if (item.path === '/settings') {
    return currentPath === '/settings';
  }
  if (item.match) {
    return item.match.some(
      (m) => currentPath === m || currentPath.startsWith(m)
    );
  }
  return currentPath === item.path || currentPath.startsWith(`${item.path}/`);
};

const isChildActive = (currentPath, child) =>
  currentPath === child.path || currentPath.startsWith(`${child.path}/`);

const Sidebar = ({ isMobile, sidebarOpen, toggleSidebar, onHover, isExpanded }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [collapsedFlyout, setCollapsedFlyout] = useState(null);
  const location = useLocation();
  const currentPath = location.pathname;

  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    let active = null;
    menuItems.forEach((item) => {
      if (item.children && isPathActive(currentPath, item)) {
        active = item.label;
      }
    });
    setOpenMenu(active);
  }, [currentPath]);

  useEffect(() => {
    if (onHover && !isMobile) onHover(isHovered);
  }, [isHovered, onHover, isMobile]);

  const expanded = isMobile ? true : isExpanded;

  useEffect(() => {
    if (expanded) setCollapsedFlyout(null);
  }, [expanded]);

  /** Accordion: only one parent menu open at a time. */
  const toggleMenu = (label) => {
    setOpenMenu((prev) => (prev === label ? null : label));
  };

  const itemClass = (active) => `
    relative flex w-full items-center transition-colors duration-150
    ${expanded ? 'px-2.5 py-2 gap-2.5 rounded-lg' : 'justify-center px-0 py-2 rounded-lg'}
    ${
      active
        ? 'bg-admin-accent-soft text-admin-accent-text'
        : 'text-admin-text-sub hover:bg-admin-raised hover:text-admin-text'
    }
  `;

  const renderLeaf = (item) => {
    const active = isPathActive(currentPath, item);
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === '/' || item.path === '/settings'}
        onClick={() => isMobile && toggleSidebar()}
        title={!expanded ? item.label : ''}
        className={itemClass(active)}
      >
        {active && expanded && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-teal-600" />
        )}
        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-admin-accent-text' : ''}`} />
        {expanded && (
          <span className={`text-[13px] ${active ? 'font-semibold' : 'font-medium'}`}>
            {item.label}
          </span>
        )}
      </NavLink>
    );
  };

  const renderChildren = (item, compact = false) => (
    <div
      className={
        compact
          ? 'space-y-0.5 p-1.5'
          : 'relative ml-4 space-y-0.5 border-l border-admin-border pl-3'
      }
    >
      {item.children.map((child, index) => {
        const childActive = isChildActive(currentPath, child);
        const ChildIcon = child.icon;
        return (
          <motion.div
            key={child.path}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15, delay: index * 0.02 }}
          >
            <Link
              to={child.path}
              onClick={() => {
                if (isMobile) toggleSidebar();
                setCollapsedFlyout(null);
              }}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] transition-colors ${
                childActive
                  ? 'bg-admin-accent-soft font-semibold text-admin-accent-text'
                  : 'text-admin-muted hover:bg-admin-raised hover:text-admin-text'
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
    const open = openMenu === item.label;
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
            <Icon className={`h-4 w-4 shrink-0 ${parentActive ? 'text-admin-accent-text' : ''}`} />
          </Link>
          {collapsedFlyout === item.label && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-full top-0 z-50 ml-2 w-52 rounded-xl border border-admin-border bg-admin-surface p-1.5 shadow-panel"
            >
              <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-admin-muted">
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
          {parentActive && (
            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-teal-600" />
          )}
          <Icon className={`h-4 w-4 shrink-0 ${parentActive ? 'text-admin-accent-text' : ''}`} />
          <span
            className={`flex-1 text-left text-[13px] ${parentActive ? 'font-semibold' : 'font-medium'}`}
          >
            {item.label}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${
              open ? 'rotate-0' : '-rotate-90'
            }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="pb-0.5 pt-0.5">{renderChildren(item)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const navBody = (
    <nav className={`h-full space-y-0.5 overflow-y-auto ${expanded ? 'p-3' : 'p-2'}`}>
      {menuItems.map((item) =>
        item.children ? renderParent(item) : renderLeaf(item)
      )}
    </nav>
  );

  if (isMobile) {
    return (
      <div
        className={`
        fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-[17rem]
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="m-2 h-[calc(100%-1rem)] overflow-hidden rounded-xl border border-admin-border bg-admin-surface shadow-panel">
          {navBody}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        fixed left-0 top-14 z-20 h-[calc(100vh-3.5rem)]
        transition-all duration-300 ease-out
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
      <div className="h-[calc(100%-1rem)] overflow-visible border-r border-admin-border bg-admin-surface">
        {navBody}
      </div>
    </div>
  );
};

export default Sidebar;
