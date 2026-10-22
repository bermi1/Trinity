import { Component } from 'react';
import TrinityApp from './logic/TrinityApp';
import LoginScreen from './components/LoginScreen';
import AppShell from './components/AppShell';
import Splash from './components/Splash';
import MobileLogin from './mobile/MobileLogin';
import MobileApp from './mobile/MobileApp';
import PinScreen from './components/PinScreen';

// Hosts the application logic and re-renders whenever it changes state.
export default class App extends Component {
  state = { version: 0 };

  constructor(props) {
    super(props);
    this.logic = new TrinityApp();
    this.logic.attach(this);
  }

  componentDidMount() { this.logic.componentDidMount(); }
  componentDidUpdate() { this.logic.componentDidUpdate(); }
  componentWillUnmount() { this.logic.componentWillUnmount(); }

  render() {
    if (this.logic.state.booting) return <Splash />;
    const v = this.logic.renderVals();
    // Quick unlock: the PIN screen covers everything until it's entered (or set up).
    if (v.showApp && v.PIN.mode) return <PinScreen v={v} />;
    // Phones get the app-style shell; tablets and computers the full desktop layout.
    if (v.phone) return v.showLogin ? <MobileLogin v={v} /> : <MobileApp v={v} />;
    return v.showLogin ? <LoginScreen v={v} /> : <AppShell v={v} />;
  }
}
