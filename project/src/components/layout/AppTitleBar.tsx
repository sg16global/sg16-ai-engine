/**
 * Title strip for the installed desktop app (window-controls-overlay mode).
 * The page paints this strip itself, so it stays SG16-dark even when Chrome would
 * draw a light frame (e.g. when the window is not focused). Hidden everywhere else.
 */
export function AppTitleBar() {
  return (
    <div className="sg16-titlebar" aria-hidden="true">
      <img src="/brand/favicon-64.png" alt="" width={16} height={16} draggable={false} />
      <span>SG16 AI Engine</span>
    </div>
  );
}
