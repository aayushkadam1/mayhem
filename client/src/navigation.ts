export const ROUTES = {
  landing: '/',
  display: '/display',
  team: '/team',
  prime: '/prime',
  judge: '/judge',
  admin: '/admin',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export interface PortalLink {
  id: 'display' | 'team' | 'prime' | 'judge' | 'admin';
  title: string;
  subtitle: string;
  path: RoutePath;
}

export const PORTALS: PortalLink[] = [
  {
    id: 'display',
    title: 'Public Display',
    subtitle: 'Leaderboard + live war votes',
    path: ROUTES.display,
  },
  {
    id: 'team',
    title: 'Team Portal',
    subtitle: 'Login and vote during war round',
    path: ROUTES.team,
  },
  {
    id: 'prime',
    title: 'Prime Portal',
    subtitle: 'Prime voting (x5 weight) during war round',
    path: ROUTES.prime,
  },
  {
    id: 'judge',
    title: 'Judge Portal',
    subtitle: 'Score teams in non-war rounds',
    path: ROUTES.judge,
  },
  {
    id: 'admin',
    title: 'Admin Panel',
    subtitle: 'Manage rounds, teams, battles, scores',
    path: ROUTES.admin,
  },
];
