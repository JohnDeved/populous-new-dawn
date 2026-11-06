/** Close while the dialog is still modal and connected, so the browser can
 * restore its opener before the parent removes the menu from the document. */
export function continuePauseMenu(dialog: HTMLDialogElement | null, onContinue: () => void) {
  dialog?.close()
  onContinue()
}
