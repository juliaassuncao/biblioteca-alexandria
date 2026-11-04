export function initials(name: string): string {
  const words = name.replace(/^@/, '').match(/[\p{L}\p{N}]+/gu) ?? [];
  return (words.length > 1 ? words[0]!.charAt(0) + words[words.length - 1]!.charAt(0) : (words[0] ?? '').slice(0, 2)).toLocaleUpperCase('pt-BR');
}
