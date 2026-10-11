import { Component, Suspense, lazy, useCallback, useState } from 'react';
import LandingClassic from './LandingClassic';

// The immersive 3D landing page loads on demand (so three.js never weighs down the app pages).
// People who prefer reduced motion, or whose browser has no WebGL, get the classic landing page.
const LandingImmersive = lazy(() => import('./LandingImmersive'));

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
};

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.warn('3D landing failed, using the classic page.', err); this.props.onFail?.(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Landing() {
  const [classic, setClassic] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches || !hasWebGL());
  const fail = useCallback(() => setClassic(true), []);
  if (classic) return <LandingClassic />;
  return (
    <Boundary onFail={fail}>
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <LandingImmersive onFail={fail} />
      </Suspense>
    </Boundary>
  );
}
