import Sheet from './Sheet';
import Icon from './Icon';

// iPhone has no install prompt; show the two taps that add the app to the home screen.
export default function InstallSteps({ onClose }) {
  return (
    <Sheet onClose={onClose} label="Install Trinity Mark 360">
      {close => (
        <div className="m-stack">
          <h3 className="m-sheet-title">Install on iPhone</h3>
          <ol className="m-steps">
            <li><Icon d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" size={20} />Tap <b>Share</b> in Safari's toolbar.</li>
            <li><Icon d="M3 5h18v16H3zM12 9v8M8 13h8" size={20} />Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>
            <li><Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" size={20} />Open <b>TM 360</b> from your home screen. It runs full screen, like any app.</li>
          </ol>
          <button className="m-primary" onClick={close}>Got it</button>
        </div>
      )}
    </Sheet>
  );
}
