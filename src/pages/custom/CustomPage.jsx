import CUSTOM from './index';

// Renders the current page when it is one of the hand-written ones.
export default function CustomPage({ v }) {
  const Page = CUSTOM[v.page];
  return Page ? <Page v={v} /> : null;
}
