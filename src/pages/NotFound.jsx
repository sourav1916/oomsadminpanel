import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle, ArrowLeft } from 'lucide-react';
import ManagementButton from '../components/common/ManagementButton';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="admin-panel w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-admin-raised">
          <AlertCircle className="h-7 w-7 text-admin-muted" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-admin-muted">
          404
        </p>
        <h1 className="mt-2 text-xl font-bold text-admin-text">Page not found</h1>
        <p className="mt-2 text-sm text-admin-text-sub">
          This route is not part of the admin console. Use the sidebar to open a working page.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <ManagementButton
            tone="teal"
            className="flex-1"
            onClick={() => navigate('/')}
            leftIcon={<Home className="h-4 w-4" />}
          >
            Dashboard
          </ManagementButton>
          <ManagementButton
            tone="slate"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Go back
          </ManagementButton>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
