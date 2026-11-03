export function panelTabStops(dialog: HTMLDialogElement): HTMLElement[] {
  const elements = Array.from(dialog.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
  )).filter(element => element.getClientRects().length > 0 && element.tabIndex >= 0);
  // Apenas o radio selecionado (ou o primeiro de um grupo sem seleção) recebe Tab.
  return elements.filter(element => {
    if (!(element instanceof HTMLInputElement) || element.type !== 'radio' || !element.name) return true;
    const group = elements.filter((candidate): candidate is HTMLInputElement =>
      candidate instanceof HTMLInputElement && candidate.type === 'radio' && candidate.name === element.name,
    );
    return element === (group.find(candidate => candidate.checked) ?? group[0]);
  });
}
