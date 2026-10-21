import Sheet from './Sheet';

const NUMERIC = /amount|value|quantity|cost|tzs/i;

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
        {v.modalFields.map((f, i) => (
          <label key={i} className="m-field">
            <span>{f.l}</span>
            {f.isSel ? (
              <select value={f.v ?? ''} onChange={f.on}>
                {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            ) : f.type === 'file' ? (
              <input type="file" onChange={f.on} />
            ) : (
              <input
                type={f.type === 'number' ? 'text' : f.type}
                inputMode={f.type === 'number' || NUMERIC.test(f.l) ? 'decimal' : undefined}
                value={f.v ?? ''}
                onChange={f.on}
                placeholder={f.ph}
                enterKeyHint={i === v.modalFields.length - 1 ? 'done' : 'next'}
              />
            )}
          </label>
        ))}
        {v.modalErr ? <div className="m-alert" role="alert">{v.modalErr}</div> : null}
      </form>
    </Sheet>
  );
}
