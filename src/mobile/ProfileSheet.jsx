import Sheet from './Sheet';
import Icon from './Icon';

// Account sheet: who is signed in, portal switching, settings and sign out.
export default function ProfileSheet({ v }) {
  return (
    <Sheet onClose={v.toggleMenu} label="Account">
      <div className="m-stack">
        <div className="m-profile">
          <span className="m-avatar is-lg" style={{ background: v.me.c }}>{v.me.i}</span>
          <div><b>{v.me.n}</b><span>{v.me.t} · {v.me.label.charAt(0) + v.me.label.slice(1).toLowerCase()} portal</span></div>
        </div>
        <div className="m-group">
          <span className="m-group-label">Switch portal</span>
          <div className="m-segment is-wrap">
            {v.portalChips.map(pc => (
              <button key={pc.l} className={pc.bg === '#2B1459' ? 'is-on' : ''} onClick={() => { v.haptic(6); pc.on(); }}>{pc.l}</button>
            ))}
          </div>
        </div>
        <div className="m-list">
          <button onClick={v.goNotes}><Icon d={v.ic.bell} size={20} />Notifications{v.hasUnread ? <span className="m-count">{v.unread}</span> : null}<Icon d={v.ic.chevR} size={18} /></button>
          <button onClick={() => v.goSettings()}><Icon d={v.ic.settings} size={20} />Settings<Icon d={v.ic.chevR} size={18} /></button>
          {v.db ? null : <button onClick={v.resetDemo}><Icon d={v.ic.refresh} size={20} />Reset demo data<Icon d={v.ic.chevR} size={18} /></button>}
          <button className="is-danger" onClick={v.signOut}><Icon d={v.ic.logout} size={20} />Sign out</button>
        </div>
      </div>
    </Sheet>
  );
}
