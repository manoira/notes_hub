export function stripHeadingPrefix(line: string): string {
  if (line.startsWith('### ')) return line.slice(4)
  if (line.startsWith('## ')) return line.slice(3)
  if (line.startsWith('# ')) return line.slice(2)
  return line
}

export function stripListPrefix(line: string): string {
  if (line.startsWith('- [ ] ')) return line.slice(6)
  if (/^- \[[xX]\] /.test(line)) return line.slice(6)

  const ordered = line.match(/^\d+\. (.*)$/)
  if (ordered) return ordered[1]

  if (line.startsWith('- ')) return line.slice(2)
  if (line.startsWith('* ')) return line.slice(2)
  if (line.startsWith('+ ')) return line.slice(2)

  return line
}
