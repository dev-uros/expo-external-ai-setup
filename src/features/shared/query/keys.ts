/**
 * Query-key roots that more than one feature touches. The `users` feature owns the users cache,
 * but saving one's own profile or picture changes a row in it too — and features never import
 * each other — so the root lives here and both sides build on it.
 */
export const usersRoot = ['users'] as const;
