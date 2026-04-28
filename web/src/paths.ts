export const KEYS = {
  COOKIES: {
    USER_SESSIONS: 'hebromsys_user_sessions',
  },
} as const;

export const ROUTES = {
  NO_AUTH: {
    HOME: '/',
    SIGN_IN: '/login',
  },
  AUTHENTICATED: {
    HOME: '/dashboard',
    MEMBERS: '/dashboard/members',
    MURAL: '/dashboard/mural',
    PRAYER: '/dashboard/prayer',
    AGENDA: '/dashboard/agenda',
    GROUPS: '/dashboard/groups',
    PROFILE: '/dashboard/profile',
    ID_CARD: '/dashboard/id-card',
  },
} as const;

export const authenticatedRoutes: string[] = Object.values(ROUTES.AUTHENTICATED);
export const withoutAuthenticatedRoutes: string[] = Object.values(ROUTES.NO_AUTH);
