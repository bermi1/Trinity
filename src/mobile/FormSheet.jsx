import Sheet from './Sheet';
import FormFields from '../components/FormFields';

// Forms open as a bottom sheet with the submit button kept above the keyboard.
export default function FormSheet({ v }) {
  const submit = e => { e.preventDefault(); v.haptic(12); v.modalSubmit(); };
  return (
    <Sheet
      onClose={v.modalClose}
      label={v.M.title}
      maxHeight="92vh"
      footer={close => (
        <div className="m-sheet-actions">
          <button type="button" className="m-secondary" onClick={close}>Cancel</button>
          <button type="submit" form="m-form" className="m-primary">{v.M.submit}</button>
        </div>
      )}
    >
      <form id="m-form" className="m-stack" onSubmit={submit} noValidate>
        <div>
          <h3 className="m-sheet-title">{v.M.title}</h3>
          {v.M.sub ? <p className="m-sheet-sub">{v.M.sub}</p> : null}
        </div>
        <FormFields fields={v.modalFields} />
        {v.modalErr ? <div className="m-alert" role="alert">{v.modalErr}</div> : null}
      </form>
    </Sheet>
  );
}
