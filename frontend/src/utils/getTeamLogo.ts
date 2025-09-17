export function getTeamLogo(teamName: string | undefined | null): string {
  if (!teamName) return '/placeholder.svg'
  const key = teamName.trim().toLowerCase()
  // Mapping riservato per futuro utilizzo; al momento usiamo un placeholder neutro
  const mapping: Record<string, string> = {
    // esempio: 'juventus': '/img/clubs/juventus.svg'
  }
  return mapping[key] || '/placeholder.svg'
}


