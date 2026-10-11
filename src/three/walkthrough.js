// Scroll-driven 3D walkthrough for the landing page (three.js).
// A camera glides down a long corridor and stops at eight "chapters". Each chapter has its own
// colour and a 3D prop that represents one stage of the MailRakshak pipeline.
//
// API:  const w = createWalkthrough({ canvas, onFrame });
//       w.setProgress(0..1)   // scroll progress
//       w.dispose()
// onFrame(u) is called every frame with the chapter coordinate (0..N-1, eased so the camera
// lingers at each chapter). The React page uses it to fade the text overlays in and out.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const SPACING = 42; // distance between chapters
export const COLORS = ['#22ff9c', '#38e8ff', '#a78bfa', '#22ff9c', '#ffb020', '#ff4fd8', '#ffd166', '#22ff9c'];
export const N = COLORS.length;

const smoother = (f) => f * f * f * (f * (f * 6 - 15) + 10);
const frac = (x) => x - Math.floor(x);

// scroll progress (0..1) -> chapter coordinate (0..N-1) with a flat spot at every chapter
export function chapterCoord(progress) {
  const u = Math.min(Math.max(progress, 0), 1) * (N - 1);
  const i = Math.min(Math.floor(u), N - 2);
  return i + smoother(u - i);
}

const fixed = (hex, k = 1, extra = {}) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false, ...extra });
const fixedLine = (hex, k = 1, opacity = 1) => new THREE.LineBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false, transparent: opacity < 1, opacity });

const dummy = new THREE.Object3D();

function tickRing(radius, count, len, material) {
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, len, 0.03), material, count);
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    dummy.rotation.set(0, 0, a);
    dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix);
  }
  dummy.rotation.set(0, 0, 0);
  return m;
}

function labelSprite(text, color) {
  const c = document.createElement('canvas');
  c.width = 320; c.height = 80;
  const g = c.getContext('2d');
  g.font = '700 40px "Chakra Petch", system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = color; g.shadowBlur = 14;
  g.fillStyle = color;
  g.fillText(text, 160, 42);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  s.scale.set(2.4, 0.6, 1);
  return s;
}

const ll = (lat, lng, r) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};

// ------------------------------------------------------------------ props
function buildShield(color) {
  const group = new THREE.Group();
  const tex = new THREE.TextureLoader().load('/logo-mark.png');
  tex.colorSpace = THREE.SRGBColorSpace;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, (2.6 * 280) / 256), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  const r1 = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.02, 8, 96), fixed(color, 1.8));
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.012, 8, 96), fixed(color, 1.4));
  r2.rotation.x = 1.15;
  const r3 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.01, 8, 96), fixed(color, 1.2));
  r3.rotation.y = 1.0;
  const ticks = tickRing(2.4, 56, 0.16, fixed(color, 1.6));
  group.add(plane, r1, r2, r3, ticks);
  return {
    group,
    update(dt, t) {
      plane.position.y = Math.sin(t * 1.2) * 0.08;
      r2.rotation.z += dt * 0.3; r3.rotation.z -= dt * 0.22; ticks.rotation.z += dt * 0.12;
    },
  };
}


// Hero: the shield with a ring of small envelopes orbiting it
function buildHero(color) {
  const base = buildShield(color);
  const w = 0.5, h = 0.34;
  const pts = [-w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0, -w / 2, h / 2, 0, -w / 2, -h / 2, 0, -w / 2, h / 2, 0, 0, 0.02, 0, 0, 0.02, 0, w / 2, h / 2, 0];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const orbit = new THREE.Group();
  const mails = Array.from({ length: 7 }, (_, i) => {
    const e = new THREE.LineSegments(geo, fixedLine('#ffffff', 1.1));
    orbit.add(e);
    return { e, a: (i / 7) * Math.PI * 2 };
  });
  orbit.rotation.x = 1.0;
  base.group.add(orbit);
  return {
    group: base.group,
    update(dt, t) {
      base.update(dt, t);
      orbit.rotation.z += dt * 0.35;
      mails.forEach((m, i) => {
        m.e.position.set(Math.cos(m.a) * 3.5, Math.sin(m.a) * 3.5, 0);
        m.e.rotation.set(t * 0.6 + i, t * 0.4, 0);
      });
    },
  };
}

function buildEnvelopes(color) {
  const group = new THREE.Group();
  const w = 1.2, h = 0.8;
  const pts = [-w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0, -w / 2, h / 2, 0, -w / 2, -h / 2, 0, -w / 2, h / 2, 0, 0, 0.05, 0, 0, 0.05, 0, w / 2, h / 2, 0];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const fillGeo = new THREE.PlaneGeometry(w, h);
  const items = Array.from({ length: 12 }, (_, i) => {
    const e = new THREE.Group();
    e.add(new THREE.LineSegments(geo, fixedLine(color, 1.8)));
    e.add(new THREE.Mesh(fillGeo, fixed(color, 0.5, { transparent: true, opacity: 0.1, side: THREE.DoubleSide })));
    group.add(e);
    return { e, a: i * 2.4, r: 1.2 + (i % 4) * 0.55, offset: i / 12, spin: 0.4 + (i % 3) * 0.25 };
  });
  return {
    group,
    update(dt, t) {
      items.forEach((it) => {
        const p = frac(t * 0.11 + it.offset);
        const ang = it.a + t * 0.25;
        it.e.position.set(Math.cos(ang) * it.r, Math.sin(ang) * it.r * 0.7, -5 + p * 9);
        it.e.rotation.set(t * it.spin * 0.5, t * it.spin, 0);
        it.e.scale.setScalar(Math.max(0.001, Math.sin(Math.PI * p)));
      });
    },
  };
}

function buildNeural(color) {
  const group = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(1.5, 1);
  const shell = new THREE.Mesh(geo, fixed(color, 1.3, { wireframe: true, transparent: true, opacity: 0.55 }));
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 2), fixed(color, 1.8));
  const nodes = new THREE.Points(geo, new THREE.PointsMaterial({ color: new THREE.Color(color).multiplyScalar(1.8), size: 0.11, toneMapped: false }));
  group.add(shell, core, nodes);
  const orbits = [0, 1, 2].map((i) => {
    const holder = new THREE.Group();
    holder.rotation.set(i * 1.05, i * 0.7, 0);
    holder.add(new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.01, 6, 96), fixed(color, 1.2)));
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), fixed(color, 2.2));
    holder.add(bead);
    group.add(holder);
    return { bead, speed: 0.6 + i * 0.25 };
  });
  return {
    group,
    update(dt, t) {
      shell.rotation.y += dt * 0.25; shell.rotation.x += dt * 0.08;
      nodes.rotation.copy(shell.rotation);
      core.scale.setScalar(1 + Math.sin(t * 2.2) * 0.12);
      orbits.forEach((o) => o.bead.position.set(Math.cos(t * o.speed) * 2.2, Math.sin(t * o.speed) * 2.2, 0));
    },
  };
}

function buildGates(color) {
  const group = new THREE.Group();
  const labels = ['SPF', 'DKIM', 'DMARC'];
  const rings = [0, -6, -12].map((z, i) => {
    const outer = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.05, 8, 120), fixed(color, 1.8));
    const ticks = tickRing(3.1, 72, 0.14, fixed(color, 1.3));
    const label = labelSprite(labels[i], '#' + new THREE.Color(color).getHexString());
    label.position.set(0, 4.2, 0);
    const holder = new THREE.Group();
    holder.position.z = z;
    holder.add(outer, ticks, label);
    group.add(holder);
    return { ticks, dir: i % 2 ? 1 : -1 };
  });
  return { group, update(dt) { rings.forEach((r) => { r.ticks.rotation.z += dt * 0.3 * r.dir; }); } };
}

function buildGlobe(color) {
  const group = new THREE.Group();
  const R = 1.7;
  const globe = new THREE.Group();
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R, 28, 18), fixed(color, 1, { wireframe: true, transparent: true, opacity: 0.18 })));
  const dots = [];
  const total = 1100;
  for (let i = 0; i < total; i += 1) {
    const lat = (Math.asin(1 - (2 * (i + 0.5)) / total) * 180) / Math.PI;
    const lng = ((i * 137.508) % 360) - 180;
    if (Math.sin(lat * 0.35) + Math.cos(lng * 0.027 * 10) + Math.sin((lat + lng) * 0.2) > 0.25) dots.push(ll(lat, lng, R * 1.005));
  }
  const dg = new THREE.BufferGeometry().setFromPoints(dots);
  globe.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: new THREE.Color(color).multiplyScalar(1.4), size: 0.045, toneMapped: false })));
  const a = ll(55.7, 37.6, R);
  const b = ll(26.4, 80.3, R);
  const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * 2.1);
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)), fixedLine('#ff3b5c', 1.6)));
  const markers = [a, b].map((p, i) => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), fixed(i ? color : '#ff3b5c', 2));
    dot.position.copy(p);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.12, 24), fixed(i ? color : '#ff3b5c', 1.8, { side: THREE.DoubleSide, transparent: true }));
    ring.position.copy(p);
    ring.lookAt(p.clone().multiplyScalar(2));
    globe.add(dot, ring);
    return ring;
  });
  const packet = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), fixed('#ffffff', 2.4));
  globe.add(packet);
  group.add(globe);
  return {
    group,
    update(dt, t) {
      globe.rotation.y += dt * 0.18;
      packet.position.copy(curve.getPoint(frac(t * 0.28)));
      markers.forEach((m, i) => { const s = 1 + frac(t * 0.7 + i * 0.5) * 1.8; m.scale.setScalar(s); m.material.opacity = 1 - (s - 1) / 1.8; });
    },
  };
}

function buildCluster(color) {
  const group = new THREE.Group();
  const pts = [];
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 30; i += 1) {
    const v = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(0.8 + rnd() * 1.4);
    pts.push(v);
  }
  const lines = [];
  for (let i = 0; i < pts.length; i += 1) for (let j = i + 1; j < pts.length; j += 1) if (pts[i].distanceTo(pts[j]) < 1.5) lines.push(pts[i], pts[j]);
  group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lines), fixedLine(color, 1.3, 0.7)));
  group.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), new THREE.PointsMaterial({ color: new THREE.Color(color).multiplyScalar(2), size: 0.13, toneMapped: false })));
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), fixed('#ffffff', 2));
  group.add(hub);
  return { group, update(dt, t) { group.rotation.y += dt * 0.22; group.rotation.x = Math.sin(t * 0.3) * 0.2; hub.scale.setScalar(1 + Math.sin(t * 3) * 0.15); } };
}

function buildChain(color) {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  inner.scale.setScalar(0.62);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const edges = new THREE.EdgesGeometry(box);
  const pos = [];
  for (let i = 0; i < 5; i += 1) {
    const p = new THREE.Vector3(i * 1.8 - 3.6, Math.sin(i * 0.9) * 0.4, 0);
    pos.push(p);
    const b = new THREE.Group();
    b.add(new THREE.LineSegments(edges, fixedLine(color, i === 4 ? 2.2 : 1.3)));
    b.add(new THREE.Mesh(box, fixed(color, 0.5, { transparent: true, opacity: i === 4 ? 0.3 : 0.1 })));
    b.position.copy(p);
    inner.add(b);
  }
  const links = [];
  for (let i = 0; i < 4; i += 1) links.push(pos[i].clone().add(new THREE.Vector3(0.5, 0, 0)), pos[i + 1].clone().add(new THREE.Vector3(-0.5, 0, 0)));
  inner.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(links), fixedLine(color, 1.6)));
  const anchor = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.02, 8, 64), fixed(color, 2));
  anchor.position.copy(pos[4]).add(new THREE.Vector3(0, 1.1, 0));
  anchor.rotation.x = Math.PI / 2;
  inner.add(anchor);
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), fixed('#ffffff', 2.4));
  inner.add(pulse);
  group.add(inner);
  return {
    group,
    update(dt, t) {
      const p = frac(t * 0.3) * 4;
      const i = Math.min(3, Math.floor(p));
      pulse.position.lerpVectors(pos[i], pos[i + 1], p - i);
      anchor.rotation.z += dt * 0.8;
      inner.rotation.y = Math.sin(t * 0.3) * 0.25;
    },
  };
}

// ------------------------------------------------------------------ scene
export function createWalkthrough({ canvas, onFrame }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const small = window.innerWidth < 768;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setClearColor(0x02060b, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02060b, 0.024);
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 400);

  const LENGTH = (N - 1) * SPACING;
  const zStart = 12;
  const zEnd = -(LENGTH + 40);
  const span = zStart - zEnd;

  // colour that eases from chapter to chapter; everything registered here follows it
  const tint = new THREE.Color(COLORS[0]);
  const tinted = [];
  const reg = (m, k = 1) => { tinted.push([m, k]); return m; };
  const bm = (k, extra = {}) => reg(new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, ...extra }), k);
  const lm = (k, opacity = 1) => reg(new THREE.LineBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: opacity < 1, opacity }), k);

  // floor grid
  const grid = [];
  for (let x = -14; x <= 14; x += 2) grid.push(x, 0, zStart, x, 0, zEnd);
  for (let z = zStart; z >= zEnd; z -= 4) grid.push(-14, 0, z, 14, 0, z);
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.Float32BufferAttribute(grid, 3));
  scene.add(new THREE.LineSegments(gg, lm(0.4, 0.22)));

  // light strips along the floor edges and the ceiling
  const stripMat = bm(0.85);
  [[-5, 0.04, 0.1, 0.08], [5, 0.04, 0.1, 0.08], [-2.5, 9, 0.1, 0.1], [2.5, 9, 0.1, 0.1]].forEach(([x, y, w, h]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, span), stripMat);
    m.position.set(x, y, (zStart + zEnd) / 2);
    scene.add(m);
  });

  // pillars with a glowing edge
  const pCount = Math.ceil(span / 10) + 1;
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 13, 0.6), new THREE.MeshBasicMaterial({ color: 0x04070c }), pCount * 2);
  const glows = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 11, 0.08), bm(0.7), pCount * 2);
  let n = 0;
  for (let i = 0; i < pCount; i += 1) {
    for (const s of [-1, 1]) {
      dummy.position.set(s * 12, 6.5, zStart - i * 10);
      dummy.updateMatrix();
      bodies.setMatrixAt(n, dummy.matrix);
      dummy.position.set(s * 11.6, 6.5, zStart - i * 10);
      dummy.updateMatrix();
      glows.setMatrixAt(n, dummy.matrix);
      n += 1;
    }
  }
  scene.add(bodies, glows);

  // arches over the path
  const aCount = Math.ceil(span / 20) + 1;
  const arches = new THREE.InstancedMesh(new THREE.TorusGeometry(9, 0.05, 8, 64, Math.PI), bm(0.6), aCount);
  for (let i = 0; i < aCount; i += 1) {
    dummy.position.set(0, 0, zStart - i * 20);
    dummy.updateMatrix();
    arches.setMatrixAt(i, dummy.matrix);
  }
  scene.add(arches);

  // drifting dust
  const PN = small ? 500 : 1000;
  const ppos = new Float32Array(PN * 3);
  const pspd = new Float32Array(PN);
  for (let i = 0; i < PN; i += 1) {
    ppos[i * 3] = (Math.random() - 0.5) * 26;
    ppos[i * 3 + 1] = Math.random() * 9;
    ppos[i * 3 + 2] = zStart - Math.random() * span;
    pspd[i] = 0.15 + Math.random() * 0.35;
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  scene.add(new THREE.Points(pgeo, reg(new THREE.PointsMaterial({ size: 0.07, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), 0.9)));


  // ---- atmosphere ----
  const colB = new THREE.Color();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(300, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uTop; uniform vec3 uHor; varying vec3 vP; void main(){ float h = clamp(vP.y * 0.5 + 0.5, 0.0, 1.0); gl_FragColor = vec4(mix(uHor, uTop, pow(h, 1.3)), 1.0); }',
    }),
  );
  sky.renderOrder = -10;
  scene.add(sky);

  const SN = small ? 400 : 900;
  const spos = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i += 1) {
    const r = 150 + Math.random() * 100, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    spos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    spos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) * 0.9 + 4;
    spos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const sgeo = new THREE.BufferGeometry();
  sgeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const stars = new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xbfd8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.7, depthWrite: false, fog: false }));
  scene.add(stars);

  const auroraMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTime: { value: 0 }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() } },
    vertexShader: 'uniform float uTime; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.z += sin(uv.y * 40.0 + uTime * 0.7) * 0.9 + sin(p.x * 0.5 + uTime * 0.5) * 0.6; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
    fragmentShader: 'uniform vec3 uA; uniform vec3 uB; uniform float uTime; varying vec2 vUv; void main(){ float band = sin(vUv.y * 70.0 + uTime * 0.8) * 0.5 + 0.5; float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x); vec3 c = mix(uA, uB, band * 0.7 + vUv.x * 0.3); gl_FragColor = vec4(c, edge * (0.07 + 0.09 * band)); }',
  });
  const aurora = new THREE.Mesh(new THREE.PlaneGeometry(34, span, 24, 120), auroraMat);
  aurora.rotation.x = -Math.PI / 2;
  aurora.position.set(0, 13, (zStart + zEnd) / 2);
  scene.add(aurora);

  const runway = new THREE.Mesh(new THREE.PlaneGeometry(9, span), bm(0.5, { transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false }));
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(0, 0.02, (zStart + zEnd) / 2);
  scene.add(runway);

  const orbTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.25)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const orbMatA = reg(new THREE.SpriteMaterial({ map: orbTex, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), 0.8);
  const orbMatB = new THREE.SpriteMaterial({ map: orbTex, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const orbs = Array.from({ length: small ? 22 : 46 }, (_, i) => {
    const sp = new THREE.Sprite(i % 3 === 0 ? orbMatB : orbMatA);
    const sc = 0.9 + Math.random() * 2.6;
    sp.scale.set(sc, sc, 1);
    sp.position.set((Math.random() - 0.5) * 22, 0.6 + Math.random() * 7.5, zStart - Math.random() * span);
    scene.add(sp);
    return { sp, y0: sp.position.y, ph: Math.random() * 6.28, sp2: 0.2 + Math.random() * 0.4 };
  });

  // chapter props
  const builders = [buildHero, buildEnvelopes, buildNeural, buildGates, buildGlobe, buildCluster, buildChain, buildShield];
  const anchors = [
    { land: [5.6, 2.0, -6.5], port: [0, 3.5, -8.5] },
    { land: [4.2, 1.9, -6.5], port: [0, 3.6, -8.5] },
    { land: [4.2, 1.9, -6.5], port: [0, 3.6, -8.5] },
    { land: [0, 1.7, -3], port: [0, 1.7, -3] },
    { land: [4.2, 1.9, -6.5], port: [0, 3.6, -8.5] },
    { land: [4.2, 1.9, -6.5], port: [0, 3.6, -8.5] },
    { land: [4.2, 1.9, -6.5], port: [0, 3.6, -8.5] },
    { land: [0, 2.7, -8.5], port: [0, 3.2, -8.5] },
  ];
  const props = builders.map((build, i) => {
    const p = build(COLORS[i]);
    scene.add(p.group);
    return p;
  });
  const layout = () => {
    const portrait = camera.aspect < 0.9;
    props.forEach((p, i) => {
      const [x, y, dz] = portrait ? anchors[i].port : anchors[i].land;
      p.group.position.set(x, y, -i * SPACING + dz);
    });
  };

  // post-processing (glow); skipped on small screens
  let composer = null;
  if (!small) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // rolls bright highlights off gently
    renderer.toneMappingExposure = 0.95;
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.45, 0.85));
    composer.addPass(new OutputPass());
  }

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    layout();
  };
  resize();

  // animation loop
  let target = 0, smooth = 0, time = 0, last = performance.now(), raf = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;

    smooth += (target - smooth) * (1 - Math.exp(-dt * 5));
    const u = chapterCoord(smooth);
    mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 3));
    mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 3));

    const camZ = 5 - u * SPACING;
    camera.position.set(Math.sin(time * 0.4) * 0.25 + mouse.x * 0.5, 1.7 + Math.sin(time * 0.7) * 0.06, camZ);
    camera.lookAt(mouse.x * 1.2, 1.7 + mouse.y * 0.5, camZ - 12);

    const i = Math.min(Math.floor(u), N - 2);
    tint.set(COLORS[i]).lerp(colB.set(COLORS[i + 1]), smoother(u - i));
    tinted.forEach(([m, k]) => m.color.copy(tint).multiplyScalar(k));
    // a second, shifted hue gives the sky and lights some depth
    colB.copy(tint).offsetHSL(0.16, 0, 0);
    orbMatB.color.copy(colB);
    auroraMat.uniforms.uA.value.copy(tint);
    auroraMat.uniforms.uB.value.copy(colB);
    auroraMat.uniforms.uTime.value = time;
    sky.material.uniforms.uHor.value.copy(tint).multiplyScalar(0.07);
    sky.material.uniforms.uTop.value.copy(colB).multiplyScalar(0.035);
    sky.position.copy(camera.position);
    stars.position.copy(camera.position);
    orbs.forEach((o) => { o.sp.position.y = o.y0 + Math.sin(time * o.sp2 + o.ph) * 0.35; });

    props.forEach((p) => p.update(dt, time));
    for (let k = 0; k < PN; k += 1) {
      const idx = k * 3 + 1;
      ppos[idx] += pspd[k] * dt;
      if (ppos[idx] > 9) ppos[idx] = 0.1;
    }
    pgeo.attributes.position.needsUpdate = true;

    if (composer) composer.render(); else renderer.render(scene, camera);
    if (onFrame) onFrame(u);
  };
  raf = requestAnimationFrame(frame);

  const onMove = (e) => { mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2; mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2; };
  const onVis = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('visibilitychange', onVis);

  return {
    setProgress(p) { target = Math.min(Math.max(p, 0), 1); },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      });
      if (composer) composer.dispose();
      renderer.dispose();
    },
  };
}
