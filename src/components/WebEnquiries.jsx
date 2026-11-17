import { useEffect, useState } from 'react';
import { Card, Btn, Pill, Empty } from '../ui/kit';
import { ENQ_STATUS } from '../logic/enquiries';

const when = iso => {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// Enquiries sent from the public website, shown at the top of CRM.
export default function WebEnquiries({ v }) {
  const E = v.ENQ;
  const [show, setShow] = useState('open');
  const [openId, setOpenId] = useState(null);
  const loaded = E.list !== null;
  useEffect(() => { if (!loaded && !E.busy) E.load(); }, [E, loaded]);

  const all = E.list || [];
  const fresh = all.filter(q => q.status === 'new').length;
  const list = show === 'open' ? all.filter(q => q.status === 'new' || q.status === 'contacted') : all;
  const title = 'Website enquiries' + (fresh ? ' · ' + fresh + ' new' : '');

  return (
    <div className="webenq" data-testid="web-enquiries">
      <Card title={title} pad={false} aside={
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Btn kind="ghost" onClick={() => setShow(show === 'open' ? 'all' : 'open')}>{show === 'open' ? 'Show all' : 'Show open only'}</Btn>
          <Btn kind="ghost" icon={v.ic.refresh} onClick={E.load}>Refresh</Btn>
        </div>
      }>
        {!loaded ? <Empty>Loading enquiries…</Empty> : list.length === 0 ? (
          <Empty>{all.length ? 'No open enquiries. Everything from the website has been handled.' : 'No enquiries from the website yet. Messages sent from the contact form appear here.'}</Empty>
        ) : (
          <ul className="webenq-list">
            {list.map(q => {
              const st = ENQ_STATUS[q.status] || ENQ_STATUS.new, open = openId === q.id;
              return (
                <li key={q.id} className="webenq-item" data-enquiry={q.email}>
                  <button type="button" className="webenq-head" aria-expanded={open} onClick={() => setOpenId(open ? null : q.id)}>
                    <span className="webenq-who">
                      <strong>{q.name}</strong>{q.company ? <span> · {q.company}</span> : null}
                      <small>{[q.service, when(q.created_at)].filter(Boolean).join(' · ')}</small>
                    </span>
                    <Pill l={st[0]} bg={st[1]} fg={st[2]} />
                  </button>
                  {open ? (
                    <div className="webenq-body">
                      <p className="webenq-msg">{q.message}</p>
                      <dl className="webenq-meta">
                        <div><dt>Email</dt><dd><a href={'mailto:' + q.email}>{q.email}</a></dd></div>
                        {q.phone ? <div><dt>Phone</dt><dd><a href={'tel:' + q.phone.replace(/[^\d+]/g, '')}>{q.phone}</a></dd></div> : null}
                        {q.event_date ? <div><dt>When</dt><dd>{q.event_date}</dd></div> : null}
                      </dl>
                      <div className="webenq-actions">
                        {q.status !== 'converted' ? <Btn kind="dark" onClick={() => E.toLead(q)}>Add as lead</Btn> : null}
                        {q.status === 'new' ? <Btn kind="ghost" onClick={() => E.set(q, 'contacted')}>Mark contacted</Btn> : null}
                        {q.status === 'new' || q.status === 'contacted' ? <Btn kind="ghost" onClick={() => E.set(q, 'closed')}>Close</Btn> : null}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
