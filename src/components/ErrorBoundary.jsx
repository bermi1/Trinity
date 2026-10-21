import { Component } from 'react';

const STORAGE_KEYS = ['tm360', 'tm360data'];

// Keeps a render error from blanking the page and offers a way back:
// saved demo data from an older version is the most likely cause.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Trinity Mark 360 crashed:', error, info.componentStack);
  }

  reset = () => {
    try { STORAGE_KEYS.forEach(k => localStorage.removeItem(k)); } catch (e) {}
    location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#F4F1FA' }}>
        <div style={{ maxWidth: 440, background: '#fff', border: '1px solid #E8E4EF', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ font: "600 11px 'IBM Plex Mono',monospace", letterSpacing: '.16em', color: '#8A7239' }}>TRINITY MARK 360</span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ margin: 0, color: '#6E6A7C', fontSize: 14, lineHeight: 1.6 }}>
            The page could not be shown. Resetting the demo data saved in this browser usually fixes it.
          </p>
          <button onClick={this.reset} style={{ height: 44, border: 'none', borderRadius: 10, background: '#2B1459', color: '#fff', fontWeight: 700, fontSize: 14 }}>
            Reset demo data and reload
          </button>
        </div>
      </div>
    );
  }
}
