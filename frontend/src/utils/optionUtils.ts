/**
 * Utilities to handle option normalization between letter-coded answers
 * (e.g., 'A') and full option strings (e.g., 'A: Deoxyribonucleic Acid').
 */
export function getOptionKey(option: string): string | null {
  if (!option) return null
  const match = option.match(/^\s*([A-Za-z0-9]+)\s*[:.)]\s*/)
  return match ? match[1] : null
}

export function mapAnswersToOptionStrings(opts: string[] | undefined, answers: string[] | undefined) {
  if (!opts || !answers || answers.length === 0) return answers ?? []
  const mapped: string[] = []
  for (const a of answers) {
    // prefer exact match of option string
    const exact = opts.find((o) => o === a)
    if (exact) {
      mapped.push(exact)
      continue
    }
    // try to match by key using prefixes like "A:" or "A." or "A)"
    const keyMatch = opts.find((o) => {
      const k = getOptionKey(o)
      return k !== null && k.toLowerCase() === a.toLowerCase()
    })
    if (keyMatch) {
      mapped.push(keyMatch)
      continue
    }
    // fallback: push original value
    mapped.push(a)
  }
  return mapped
}

export function isOptionCorrect(option: string, answers: string[] | undefined) {
  if (!answers || answers.length === 0) return false
  if (answers.includes(option)) return true
  const key = getOptionKey(option)
  if (key && answers.some((a) => a.toLowerCase() === key.toLowerCase())) return true
  // Also try matching by the option text without the leading key (e.g., 'A: foo' -> 'foo')
  const text = option.replace(/^[^:]+:\s*/, '').trim()
  if (text && answers.some((a) => a.toLowerCase() === text.toLowerCase())) return true
  return false
}

export default { getOptionKey, mapAnswersToOptionStrings, isOptionCorrect }
