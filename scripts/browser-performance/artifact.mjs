// Preserve the single report.json contract while sharing the bounded ZIP parser.
import { readArtifactZip } from '../artifact-zip.mjs'
import { maxReportBytes } from './protocol.mjs'
export function readReportArchive(input) {
  const files = readArtifactZip(input, { maxArchiveBytes: maxReportBytes + 65536,
    maxFileBytes: maxReportBytes, maxTotalBytes: maxReportBytes, maxEntries: 1,
    allowName: name => name === 'report.json' })
  const bytes = files.get('report.json')
  if (!bytes?.length) throw Error('Empty artifact report')
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}
