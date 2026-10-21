// Minimal state container that mirrors the design runtime's logic class:
// a plain object holds `state`, `setState` merges a patch (or the result of an
// updater) immediately and asks the React host to re-render.
export default class Logic {
  state = {};
  host = null;

  attach(host) {
    this.host = host;
  }

  setState(update, cb) {
    const patch = typeof update === 'function' ? update(this.state) : update;
    this.state = { ...this.state, ...patch };
    if (this.host) this.host.setState(s => ({ version: s.version + 1 }), cb);
    else if (cb) cb();
  }

  componentDidMount() {}
  componentDidUpdate() {}
  componentWillUnmount() {}
  renderVals() { return {}; }
}
