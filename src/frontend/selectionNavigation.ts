import { useAppStore } from '../store/appStore';
import { pageHash, readPage, readSelection } from './navigation';

/** URL contains catalog selections only; never world state or traveller documents. */
export function installSelectionNavigation() {
  let hydrating = false;
  function hydrate() {
    hydrating = true;
    const previous = useAppStore.getState();
    const selection = readSelection(window.location.hash, previous);
    useAppStore.setState({ ...selection, selectionKey: null });
    const inspect = new URLSearchParams(window.location.hash.split('?')[1]).get('inspect') === 'second' ? 'second' : undefined;
    window.history.replaceState(null, '', pageHash(readPage(window.location.hash), selection, inspect));
    hydrating = false;
  }
  hydrate();
  window.addEventListener('hashchange', hydrate);
  const unsubscribe = useAppStore.subscribe((state, previous) => {
    if (hydrating || (state.passport === previous.passport && state.destination === previous.destination && state.comparison === previous.comparison)) return;
    const inspect = new URLSearchParams(window.location.hash.split('?')[1]).get('inspect') === 'second' ? 'second' : undefined;
    window.history.replaceState(null, '', pageHash(readPage(window.location.hash), state, inspect));
  });
  return () => { unsubscribe(); window.removeEventListener('hashchange', hydrate); };
}
