import { useState } from 'react';
import { PageHead, Card, Btn, Empty } from '../../ui/kit';

// A person, chosen from a searchable list (no dropdown).
function PersonPick({ value, people, onPick, label }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const cur = people.find(p => p.v === value);
  const list = q ? people.filter(p => p.l.toLowerCase().includes(q.toLowerCase())) : people;
  return (
    <div className={'ff-pick co-pick' + (open ? ' is-open' : '')}>
      <button type="button" className="ff-pick-btn" aria-label={label + ': ' + (cur ? cur.l : 'choose')} onClick={() => setOpen(!open)}><span>{cur ? cur.l : 'Choose…'}</span></button>
      {open ? (
        <div className="ff-pick-list">
          <input className="ff-search" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search people" aria-label={'Search ' + label} />
          <div role="listbox" aria-label={label}>{list.map(p => <button key={p.v} type="button" role="option" aria-selected={p.v === value} onClick={() => { onPick(p.v); setOpen(false); setQ(''); }}>{p.l}</button>)}</div>
        </div>
      ) : null}
    </div>
  );
}

// Signatures used on invoices once the signer approves them (a scan or photo on a white background).
function Signatures({ C }) {
  const [err, setErr] = useState('');
  const pick = (k, e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    if (!/^image\//.test(f.type)) { setErr('Choose an image (PNG or JPG)'); return; }
    if (f.size > 400 * 1024) { setErr('Use an image under 400 KB'); return; }
    const r = new FileReader(); r.onload = () => { setErr(''); C.setSig(k, r.result, f.name); }; r.readAsDataURL(f);
  };
  return (
    <Card title="Invoice signatures">
      <p className="k-sub" style={{ margin: '0 0 10px', fontSize: 13.5 }}>Upload each signer’s real signature. It prints on an invoice only after that person approves it in the system, with the company stamp.</p>
      <ul className="co-sections">
        {C.signatures.map(sg => (
          <li key={sg.k}>
            <span><b>{sg.l}</b>{sg.url ? <img className="co-sig" src={sg.url} alt={'Signature · ' + sg.l} /> : <small className="co-small">No signature yet</small>}</span>
            <span className="fh-row">
              <label className="bi-up"><input type="file" accept="image/png,image/jpeg" onChange={e => pick(sg.k, e)} aria-label={'Signature · ' + sg.l} />{sg.url ? 'Replace' : '↑ Upload'}</label>
              {sg.url ? <button type="button" className="td-start" onClick={() => C.setSig(sg.k, '', '')}>Remove</button> : null}
            </span>
          </li>
        ))}
      </ul>
      {err ? <div className="fm-err" role="alert">{err}</div> : null}
    </Card>
  );
}

const Sw = ({ on, set, label }) => <button type="button" role="switch" aria-checked={on} aria-label={label} className={'co-switch' + (on ? ' is-on' : '')} onClick={set}><i /></button>;

const EVENTS = [['clients', 'Client Service alerts', 'New work, enquiries, proposals, lost leads'], ['approvals', 'Approvals', 'A money request waiting for you'], ['designs', 'Designs', 'Designs to approve and approved designs'], ['payments', 'Invoices & payments', 'Invoices to sign, payments to confirm'], ['tasks', 'Tasks', 'A new task given to you']];

function Notify({ C }) {
  const N = C.notify;
  const [edit, setEdit] = useState(null);
  const [ph, setPh] = useState('');
  return (
    <Card title="Alerts outside the system">
      <p className="k-sub" style={{ margin: '0 0 10px', fontSize: 13.5 }}>Important alerts also go to people’s phones, so they see them even when the system is closed.</p>
      <ul className="co-sections">
        <li><span><b>WhatsApp</b><small className="co-small">WhatsApp Business Cloud API · key not added yet</small></span><Sw on={!!N.wa} set={() => C.setNotify({ wa: !N.wa })} label="WhatsApp" /></li>
        <li><span><b>SMS</b><small className="co-small">SMS gateway · details to be added</small></span><Sw on={!!N.sms} set={() => C.setNotify({ sms: !N.sms })} label="SMS" /></li>
        <li><span><b>Email</b><small className="co-small">Daily summary and invoices</small></span><Sw on={!!N.email} set={() => C.setNotify({ email: !N.email })} label="Email" /></li>
      </ul>
      <h4 className="co-h4">Send these alerts</h4>
      <ul className="co-sections">
        {EVENTS.map(([k, l, d]) => <li key={k}><span><b>{l}</b><small className="co-small">{d}</small></span><Sw on={!!(N.events || {})[k]} set={() => C.setNotify({ events: { [k]: !(N.events || {})[k] } })} label={l} /></li>)}
      </ul>
      <h4 className="co-h4">Phone numbers</h4>
      <ul className="co-sections co-phones">
        {C.phones.map(p => (
          <li key={p.k}>
            <span>{p.n}</span>
            {edit === p.k ? (
              <form className="co-ph" onSubmit={e => { e.preventDefault(); C.setPhone(p.k, ph); setEdit(null); }}>
                <input className="ff-search" autoFocus inputMode="tel" value={ph} onChange={e => setPh(e.target.value)} placeholder="+255 7xx xxx xxx" aria-label={'Phone for ' + p.n} />
                <Btn kind="dark" type="submit">Save</Btn>
              </form>
            ) : <button type="button" className="co-phbtn" onClick={() => { setEdit(p.k); setPh(p.phone); }}>{p.phone || '+ Add number'}</button>}
          </li>
        ))}
      </ul>
      <div className="fh-row" style={{ marginTop: 12 }}><Btn kind="ghost" onClick={C.test}>Send a test alert</Btn></div>
      <h4 className="co-h4">Outbox</h4>
      {C.outbox.length ? (
        <ul className="co-outbox">
          {C.outbox.map(m => (
            <li key={m.id}>
              <span><b>{m.to}</b> · {m.phone}<small>{m.text.split('\n')[0]}</small><small>{m.at} · {m.ch} · {m.st}</small></span>
              {m.st === 'queued' ? <Btn kind="ghost" onClick={m.send}>Send on WhatsApp</Btn> : null}
            </li>
          ))}
        </ul>
      ) : <Empty>No alerts yet.</Empty>}
      <p className="k-sub" style={{ fontSize: 12.5 }}>When the WhatsApp key is added on the server, the outbox sends by itself. Until then, “Send on WhatsApp” opens the message ready to send.</p>
    </Card>
  );
}

// Company setup (administrators): which requests need fewer approvals, and which sections are switched on.
export default function CompanyPage({ v }) {
  const C = v.CO;
  const [limit, setLimit] = useState(String(C.limit));
  const [target, setTarget] = useState(String(C.csTarget));
  if (!C.can) return <Card><Empty>Only an administrator can change the company setup.</Empty></Card>;
  return (
    <>
      <PageHead kicker="System" title="Company setup" sub="Keep the system simple: fewer approvals for small amounts, and only the sections your team uses." />
      <div className="k-row">
        <Card title="Small money requests">
          <form className="k-form" onSubmit={e => { e.preventDefault(); C.setLimit(limit); }}>
            <p className="k-sub" style={{ margin: 0, flexBasis: '100%', fontSize: 13.5 }}>
              Project and office requests up to this amount go GM → Finance → paid, without Management. Larger ones also go to Management. Set 0 to send every request to Management.
            </p>
            <label>Amount (TZS)<input type="number" min="0" step="10000" inputMode="numeric" value={limit} onChange={e => setLimit(e.target.value)} /></label>
            <Btn kind="dark" type="submit">Save</Btn>
          </form>
        </Card>
        <Card title="Departments">
          <p className="k-sub" style={{ margin: '0 0 10px', fontSize: 13.5 }}>Each manager sees their team’s daily to-do, assigns them tasks and receives their “Send my day”.</p>
          <ul className="co-sections">
            {C.depts.map(d => (
              <li key={d.d}>
                <span>{d.l}</span>
                <PersonPick value={d.mgr || ''} people={C.people} onPick={d.set} label={d.l + ' manager'} />
              </li>
            ))}
          </ul>
          <form className="k-form" style={{ marginTop: 12 }} onSubmit={e => { e.preventDefault(); C.setTarget(target); }}>
            <label>Client Service target a month (TZS M)<input type="number" min="0" inputMode="numeric" value={target} onChange={e => setTarget(e.target.value)} /></label>
            <Btn kind="dark" type="submit">Save target</Btn>
          </form>
        </Card>
        <Signatures C={C} />
        <Notify C={C} />
        <Card title="Sections">
          <p className="k-sub" style={{ margin: '0 0 10px', fontSize: 13.5 }}>Switched-off sections disappear from everyone’s menus. Nothing is deleted; switch them back on any time.</p>
          <ul className="co-sections">
            {C.sections.map(s => (
              <li key={s.k}>
                <span>{s.l}</span>
                <button type="button" role="switch" aria-checked={s.on} aria-label={s.l} className={'co-switch' + (s.on ? ' is-on' : '')} onClick={s.toggle}><i /></button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
