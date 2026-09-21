/** Decorative backdrop for the auth pages: a hairline glow along the top edge,
 *  a five-row field of chevrons rising from the bottom, and a warm glow
 *  beneath it. Pure CSS (see `.auth-glow*` in globals.css, which documents
 *  the reference measurements); animation is transform/opacity only and
 *  collapses to a static frame under prefers-reduced-motion. Renders behind
 *  the layout via `z-index: -1`, so the parent must establish a stacking
 *  context (`isolate`). */
export function AuthGlow() {
  return (
    <div aria-hidden className="auth-glow">
      <div className="auth-glow__top" />
      <div className="auth-glow__field">
        <div className="auth-glow__pattern" />
        <div className="auth-glow__glow" />
      </div>
    </div>
  );
}
