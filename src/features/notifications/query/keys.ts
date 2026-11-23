/** Query keys for the notifications feature: the phone this session is on and the
 * system permission. */
export const notificationsKeys = {
  root: ['notifications'] as const,
  device: () => [...notificationsKeys.root, 'device'] as const,
  permission: () => [...notificationsKeys.root, 'permission'] as const,
};
