const names = {
  buildings: 'buildings B',
  spells: 'spells 1–3',
  followers: 'followers',
}

// Category titles were removed with browser tooltips. Use the shipped,
// nonvisual accessible names, scoped away from the rest of the HUD.
export function commandCategory(page, category) {
  if (!Object.hasOwn(names, category)) throw new Error(`Unknown command category: ${category}`)
  return page.getByRole('navigation', { name: 'Command categories', exact: true })
    .getByRole('button', { name: names[category], exact: true })
}
