import Sheet from './Sheet';
import Icon from './Icon';
import { useInstall } from './native';
import { useState } from 'react';
import InstallSteps from './InstallSteps';

// Every module that isn't on the tab bar, plus the assistant and installing the app.
export default function MoreSheet({ v }) {
  const { mode, install } = useInstall();
  const [iosHelp, setIosHelp] = useState(false);
  if (iosHelp) return <InstallSteps onClose={() => setIosHelp(false)} />;
  return (
    <Sheet onClose={v.closeMore} label="All modules">
      {close => (
        <div className="m-stack">
          <div className="m-sheet-head">
            <h3 className="m-sheet-title">All modules</h3>
            <span className="m-kicker">360 · {v.me.label}</span>
          </div>
          <div className="m-grid">
            {v.moreItems.map(m => (
              <button key={m.l} className={'m-tile' + (m.bd === '#6D3CC2' ? ' is-on' : '')} onClick={() => { v.haptic(6); m.on(); }}>
                <span className="m-tile-icon"><Icon d={m.ic} size={21} /></span>
                <span className="m-tile-label">{m.l}</span>
                {m.hb ? <span className="m-badge is-tile">{m.b}</span> : null}
              </button>
            ))}
          </div>
          <button className="m-row-btn is-gold" onClick={v.openAI}><Icon d={v.ic.sparkle} size={20} />Ask Trinity Intelligence<Icon d={v.ic.chevR} size={18} style={{ marginLeft: 'auto' }} /></button>
          {mode ? (
            <button className="m-row-btn" onClick={() => (mode === 'prompt' ? install().then(close) : setIosHelp(true))}>
              <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={20} />Install the app<Icon d={v.ic.chevR} size={18} style={{ marginLeft: 'auto' }} />
            </button>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}
