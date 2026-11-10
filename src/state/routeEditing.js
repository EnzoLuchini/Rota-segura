export function retainEditIdForView(view, editId) {
  return view === 'save' ? editId : null;
}
