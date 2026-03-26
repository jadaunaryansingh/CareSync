export default function Toaster({ toasts }) {
  const typeIcon = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  return (
    <div className="toaster">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{typeIcon[t.type] || 'ℹ️'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
