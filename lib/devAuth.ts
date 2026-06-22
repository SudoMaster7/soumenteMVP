export const DEV_AUTH_ENABLED = process.env.EXPO_PUBLIC_DISABLE_AUTH !== 'false';

export const DEV_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'dev@soumente.local',
  user_metadata: {
    name: 'Desenvolvimento',
  },
};

export function isDevUser(userId?: string | null) {
  return DEV_AUTH_ENABLED && userId === DEV_USER.id;
}
