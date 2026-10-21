// Shown when the phone loses its connection.
export default function OfflineBanner({ v }) {
  if (v.online) return null;
  return (
    <div className="m-offline" role="status">
      You’re offline. {v.db ? 'Changes can’t be saved until you reconnect.' : 'The demo keeps working on this phone.'}
    </div>
  );
}
