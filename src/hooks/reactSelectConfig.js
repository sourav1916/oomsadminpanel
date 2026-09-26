const isDark = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

export const reactSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: isDark() ? '#111827' : 'white',
    borderColor: state.isFocused ? '#0d9488' : isDark() ? '#1f2937' : '#e2e8f0',
    borderRadius: '0.5rem',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(13, 148, 136, 0.2)' : 'none',
    color: isDark() ? '#f1f5f9' : '#0f172a',
    '&:hover': {
      borderColor: state.isFocused ? '#0d9488' : isDark() ? '#334155' : '#cbd5e1',
    },
    minHeight: '38px',
    fontSize: '0.875rem',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#0d9488'
      : state.isFocused
        ? isDark()
          ? 'rgba(20, 184, 166, 0.14)'
          : '#ccfbf1'
        : isDark()
          ? '#111827'
          : 'white',
    color: state.isSelected ? 'white' : isDark() ? '#e2e8f0' : '#334155',
    cursor: 'pointer',
    fontSize: '0.875rem',
    '&:active': {
      backgroundColor: state.isSelected
        ? '#0f766e'
        : isDark()
          ? '#1f2937'
          : '#99f6e4',
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: isDark() ? '#111827' : 'white',
    borderRadius: '0.75rem',
    border: isDark() ? '1px solid #1f2937' : '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
    zIndex: 9999,
  }),
  menuList: (provided) => ({
    ...provided,
    backgroundColor: isDark() ? '#111827' : 'white',
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  singleValue: (provided) => ({
    ...provided,
    color: isDark() ? '#e2e8f0' : '#334155',
    fontSize: '0.875rem',
  }),
  input: (provided) => ({
    ...provided,
    color: isDark() ? '#e2e8f0' : '#0f172a',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: isDark() ? '#94a3b8' : '#94a3b8',
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
    color: isDark() ? '#94a3b8' : '#94a3b8',
    padding: '4px 8px',
    '&:hover': {
      color: isDark() ? '#cbd5e1' : '#64748b',
    },
  }),
};

export const getReactSelectMenuProps = () => ({
  menuPortalTarget: typeof document !== 'undefined' ? document.body : null,
  menuPosition: 'fixed',
  menuPlacement: 'auto',
});
