// Native 004314c0 binds one popup controller. Replacing its visible body does
// not acknowledge/delete either notification or mutate pause/queue ownership.
export function showCampaignPopup(
  selected: HTMLDetailsElement,
  messages: Iterable<HTMLDetailsElement>
) {
  for (const details of messages) if (details !== selected) details.open = false
  selected.open = true
}
