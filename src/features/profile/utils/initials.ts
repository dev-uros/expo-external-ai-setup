/**
 * Two letters for an avatar without a picture: first letter of the name and of the surname,
 * uppercased with Serbian rules so `š` becomes `Š`, not a decomposed `S`.
 */
export function initials(name: string, surname: string): string {
  const first = (value: string) => Array.from(value.trim())[0] ?? '';
  return `${first(name)}${first(surname)}`.toLocaleUpperCase('sr');
}
