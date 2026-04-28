import { useAuth } from '@/store/useAuth';
import { UserRole } from '@/types';

export const usePermissions = () => {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'visitor';

  const isVisitor = role === 'visitor';
  const isMember = role === 'member';
  const isSecretary = role === 'secretary';
  const isPastor = role === 'pastor';
  const isPending = role === 'pending_member';

  // Permission helpers
  const canViewGeneralFeed = true; // All roles
  const canViewAgenda = true; // All roles
  
  const canViewDashboardOverview = isSecretary || isPastor;
  const canViewGroupFeed = isMember || isSecretary || isPastor;
  const canRequestPrayer = isMember || isSecretary || isPastor;
  const canViewProfileCard = isMember || isSecretary || isPastor;
  const canSendMessage = isMember || isSecretary || isPastor;

  const canManageUsers = isSecretary || isPastor;
  const canManageAgenda = isSecretary || isPastor;
  const canPostTargetedFeed = isSecretary || isPastor;
  const canViewMetrics = isSecretary || isPastor;

  const canViewAllPrayers = isPastor;
  const canInteractWithUsers = isPastor;

  return {
    role,
    isVisitor,
    isMember,
    isSecretary,
    isPastor,
    isPending,
    permissions: {
      canViewGeneralFeed,
      canViewAgenda,
      canViewDashboardOverview,
      canViewGroupFeed,
      canRequestPrayer,
      canViewProfileCard,
      canSendMessage,
      canManageUsers,
      canManageAgenda,
      canPostTargetedFeed,
      canViewMetrics,
      canViewAllPrayers,
      canInteractWithUsers,
    },
  };
};
