const isDark = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

export const reactSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: isDark() ? '#1e293b' : 'white',
    borderColor: state.isFocused ? '#0ea5e9' : (isDark() ? '#334155' : '#d1d5db'),
    borderRadius: '0.75rem',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(14, 165, 233, 0.2)' : 'none',
    color: isDark() ? '#e2e8f0' : '#1e293b',
    '&:hover': {
      borderColor: state.isFocused ? '#0ea5e9' : (isDark() ? '#475569' : '#9ca3af'),
    },
    minHeight: '38px',
    fontSize: '0.875rem',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#0284c7'
      : state.isFocused
        ? (isDark() ? '#334155' : '#eff6ff')
        : (isDark() ? '#1e293b' : 'white'),
    color: state.isSelected ? 'white' : (isDark() ? '#e2e8f0' : '#374151'),
    cursor: 'pointer',
    fontSize: '0.875rem',
    '&:active': {
      backgroundColor: state.isSelected ? '#0369a1' : (isDark() ? '#475569' : '#dbeafe'),
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: isDark() ? '#1e293b' : 'white',
    borderRadius: '0.75rem',
    border: isDark() ? '1px solid #334155' : '1px solid #e2e8f0',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 9999,
  }),
  menuList: (provided) => ({
    ...provided,
    backgroundColor: isDark() ? '#1e293b' : 'white',
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  singleValue: (provided) => ({
    ...provided,
    color: isDark() ? '#e2e8f0' : '#374151',
    fontSize: '0.875rem',
  }),
  input: (provided) => ({
    ...provided,
    color: isDark() ? '#e2e8f0' : '#1e293b',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: isDark() ? '#94a3b8' : '#9ca3af',
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '2px 8px',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: isDark() ? '#94a3b8' : '#9ca3af',
    padding: '4px 8px',
    '&:hover': {
      color: isDark() ? '#cbd5e1' : '#6b7280',
    },
  }),
};

export const getReactSelectMenuProps = () => ({
  menuPortalTarget: typeof document !== 'undefined' ? document.body : null,
  menuPosition: 'fixed',
  menuPlacement: 'auto',
});
