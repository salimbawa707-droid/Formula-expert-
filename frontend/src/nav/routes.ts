import { Feather } from '@expo/vector-icons';

export interface NavRoute {
  key: string;
  label: string;
  path: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
}

export const NAV_ROUTES: NavRoute[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: 'grid',
    description: 'Command center for your bench work',
  },
  {
    key: 'builder',
    label: 'Formula Builder',
    path: '/builder',
    icon: 'edit-3',
    description: 'Author and tweak chemical compositions',
  },
  {
    key: 'checker',
    label: 'Formula Checker',
    path: '/checker',
    icon: 'check-circle',
    description: 'Validation and compliance review',
  },
  {
    key: 'analyzer',
    label: 'Formula Analyzer',
    path: '/analyzer',
    icon: 'bar-chart-2',
    description: 'Physical properties and cost breakdown',
  },
  {
    key: 'ai-expert',
    label: 'AI Formula Expert',
    path: '/ai-expert',
    icon: 'cpu',
    description: 'Chat with your formulation assistant',
  },
  {
    key: 'ingredients',
    label: 'Ingredient Library',
    path: '/ingredients',
    icon: 'droplet',
    description: 'Searchable raw material database',
  },
  {
    key: 'library',
    label: 'Formula Library',
    path: '/library',
    icon: 'book-open',
    description: 'Saved recipes and templates',
  },
  {
    key: 'reports',
    label: 'PDF Reports',
    path: '/reports',
    icon: 'file-text',
    description: 'Batch sheets and compliance documents',
  },
  {
    key: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'settings',
    description: 'App configuration and preferences',
  },
];
