import { useCallback, useEffect } from 'react';
import PAGES from '../pages';
import CommandPalette from '../components/CommandPalette';
import AssistantPanel from '../components/AssistantPanel';
import Toasts from '../components/Toasts';
import MobileHeader from './MobileHeader';
import TabBar from './TabBar';
import MoreSheet from './MoreSheet';
import ProfileSheet from './ProfileSheet';
import FormSheet from './FormSheet';
import PullToRefresh from './PullToRefresh';
import OfflineBanner from './OfflineBanner';
import { useKeyboardOpen, useThemeColor } from './native';

// The phone app: native-style header, screen transitions, tab bar and bottom sheets
// around the same pages the desktop uses.
export default function MobileApp({ v }) {
  const keyboard = useKeyboardOpen();
  useThemeColor('#FFFFFF');
  const Page = PAGES[v.page] || PAGES.dashboard;
  const refresh = useCallback(() => v.refresh(), [v]);
  const sheetOpen = v.modalOpen || v.moreOpen || v.menu;
  // Each screen opens at the top, including the first one after signing in.
  useEffect(() => { window.scrollTo(0, 0); }, [v.pageKey]);

  return (
    <div className={'m-app' + (keyboard ? ' is-typing' : '')}>
      <OfflineBanner v={v} />
      <MobileHeader v={v} />
      <PullToRefresh onRefresh={refresh} disabled={sheetOpen || v.aiOpen || v.cmdOpen} />
      <main key={v.pageKey} className={'m-screen is-' + v.navDir + ' page-' + v.page}>
        <Page v={v} />
      </main>
      <TabBar v={v} hidden={keyboard} />
      {v.moreOpen ? <MoreSheet v={v} /> : null}
      {v.menu ? <ProfileSheet v={v} /> : null}
      {v.modalOpen ? <FormSheet v={v} /> : null}
      {v.cmdOpen ? <div className="m-cmd"><CommandPalette v={v} /></div> : null}
      {v.aiOpen ? <div className="m-assistant"><AssistantPanel v={v} /></div> : null}
      <Toasts v={v} />
    </div>
  );
}
