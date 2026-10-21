import { Component } from 'react';
import TrinityApp from './logic/TrinityApp';
import LoginScreen from './components/LoginScreen';
import AppShell from './components/AppShell';
import Splash from './components/Splash';

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
    return v.showLogin ? <LoginScreen v={v} /> : <AppShell v={v} />;
  }
}
