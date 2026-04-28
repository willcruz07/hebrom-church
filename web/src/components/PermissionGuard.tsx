'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ROUTES } from '@/paths';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: keyof ReturnType<typeof usePermissions>['permissions'];
}

export function PermissionGuard({ children, permission }: PermissionGuardProps) {
  const { permissions, isPending } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (permission && !permissions[permission]) {
      router.replace(ROUTES.AUTHENTICATED.HOME);
    }
  }, [permission, permissions, router]);

  if (permission && !permissions[permission]) {
    return null;
  }

  return <>{children}</>;
}
