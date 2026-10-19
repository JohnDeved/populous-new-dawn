// Artifact credentials are acquisition-only, never inherited by timing descendants.
export function timingEnvironment(environment) {
  const child = { ...environment }
  delete child.GH_TOKEN
  delete child.GITHUB_TOKEN
  return child
}
