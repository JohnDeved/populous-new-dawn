/** Browser help, not recovered campaign-message text or native popup layout. */
export function BrowserHelpTips({ level }: { level: number }) {
  return (
    <>
      <p className="help-tip">
        Each spell shows its own casting range. Right-click a rechargeable spell to pause or resume
        it and focus mana elsewhere. Only your shaman can learn at the vault. Select braves and
        click a friendly hut to house them, or a completed training hut to train them. Builders
        carry logs from trees. Followers drown in water; Blast can knock them off a shore.
      </p>
      {level === 1 && (
        <p className="help-tip" data-mission-help="1">
          Mission 1: Worship the southern head for Land Bridge (four held at once), and the central
          head for four Lightning gifts.
        </p>
      )}
    </>
  )
}
