/**
 * The letter for an avatar without a picture: the first of what the person is called,
 * uppercased with Serbian rules so `š` becomes `Š`, not a decomposed `S`.
 */
export function initials(name: string): string {
  return (Array.from(name.trim())[0] ?? '').toLocaleUpperCase('sr');
}
