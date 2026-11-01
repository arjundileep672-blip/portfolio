/**
 * Dispatches custom cursor state to the main UNBOUND application cursor.
 */
export function setSceneCursor(label: string | null): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('unbound:cursor', { detail: label }));
  }
}
