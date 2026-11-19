import FormFields from './FormFields';

// Desktop form: a centred card with modern fields (chips, faces, searchable lists, amounts).
export default function FormModal({ v }) {
  const enter = e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') v.modalSubmit(); };
  return (
    <div className="fm-back" onClick={v.modalClose}>
      <div className={'fm' + (v.M.wide ? ' is-wide' : '')} onClick={v.stop} role="dialog" aria-modal="true" aria-label={v.M.title}>
        <div className="fm-head">
          <div>
            <h3>{v.M.title}</h3>
            {v.M.sub ? <p>{v.M.sub}</p> : null}
          </div>
          <button type="button" className="fm-x" onClick={v.modalClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={v.ic.x} /></svg>
          </button>
        </div>
        <div className="fm-body">
          <FormFields fields={v.modalFields || []} onEnter={enter} />
          {v.modalErr ? <div className="fm-err" role="alert">{v.modalErr}</div> : null}
        </div>
        <div className="fm-foot">
          <button type="button" className="fm-cancel" onClick={v.modalClose}>Cancel</button>
          <button type="button" className="fm-go" onClick={v.modalSubmit}>{v.M.submit}</button>
        </div>
      </div>
    </div>
  );
}
