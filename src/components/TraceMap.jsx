import { useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline, Popup } from 'react-leaflet';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { fmtElapsed, fmtTime } from '../lib/format';

// Where the mail was delivered. Change to your monitored mailbox location.
const RECIPIENT = { name: 'Monitored mailbox', lat: 26.4499, lng: 80.3319 };

const dotIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<span class="pulse-dot" style="--dot:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

// quadratic curve between two points, bowed upward
function arc(a, b, steps = 48) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const c = [mx + dist * 0.25, my];
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return [
      (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t ** 2 * b[0],
      (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t ** 2 * b[1],
    ];
  });
}

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-100">Hop {p.hop}</p>
      <p className="font-mono text-slate-400">{p.server}</p>
      <p className="mt-1 text-slate-200">Delay from previous hop: {fmtElapsed(p.delayMs)}</p>
    </div>
  );
};

export default function TraceMap({ forensics, enrichment }) {
  const hops = forensics?.relay_path ?? [];
  const geo = enrichment?.geolocation;

  const hopData = useMemo(
    () =>
      hops.map((h, i) => {
        const delayMs = i === 0 ? 0 : new Date(h.timestamp) - new Date(hops[i - 1].timestamp);
        return { hop: h.hop, label: `#${h.hop}`, server: h.server, timestamp: h.timestamp, delayMs, delaySec: +(delayMs / 1000).toFixed(1), odd: delayMs < 0 || delayMs > 60000 };
      }),
    [hops],
  );

  const origin = geo?.lat != null ? [geo.lat, geo.lng] : null;
  const dest = [RECIPIENT.lat, RECIPIENT.lng];
  const path = useMemo(() => (origin ? arc(origin, dest) : []), [origin?.[0], origin?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="lg:col-span-3">
        {origin ? (
          <MapContainer
            bounds={[origin, dest]}
            boundsOptions={{ padding: [50, 50], maxZoom: 5 }}
            scrollWheelZoom={false}
            className="h-80 w-full"
            worldCopyJump
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={18}
            />
            <Polyline positions={path} pathOptions={{ color: '#ff3b5c', weight: 2, dashArray: '6 8', className: 'trace-line' }} />
            <Marker position={origin} icon={dotIcon('#ff3b5c')}>
              <Popup>
                <strong>Likely origin</strong><br />
                {geo.city}, {geo.country}<br />
                <span className="font-mono">{geo.ip}</span><br />
                {geo.isp}
              </Popup>
            </Marker>
            <CircleMarker center={dest} radius={7} pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.9 }}>
              <Popup>{RECIPIENT.name}</Popup>
            </CircleMarker>
          </MapContainer>
        ) : (
          <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-white/15 text-sm text-slate-400">
            The sending IP could not be geolocated.
          </div>
        )}
        {geo && (
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-slate-500">Origin</dt><dd className="text-slate-100">{geo.city}, {geo.country}</dd></div>
            <div><dt className="text-xs text-slate-500">Sending IP</dt><dd className="font-mono text-slate-100">{geo.ip}</dd></div>
            <div><dt className="text-xs text-slate-500">Network</dt><dd className="text-slate-100">{geo.isp}</dd></div>
            <div><dt className="text-xs text-slate-500">Infrastructure</dt><dd className="capitalize text-slate-100">{enrichment.infrastructure_type}</dd></div>
          </dl>
        )}
      </div>

      <div className="lg:col-span-2">
        <p className="mb-2 text-sm font-medium text-slate-200">Delay between relay hops (seconds)</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hopData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,.25)" />
              <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
              <Bar dataKey="delaySec" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900}>
                {hopData.map((d) => (
                  <Cell key={d.hop} fill={d.odd ? '#ff3b5c' : '#38bdf8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-xs text-slate-500">Red bars: out-of-order or unusually slow hops.</p>

        <ol className="mt-4 space-y-0">
          {hopData.map((h, i) => (
            <li key={h.hop} className="relative flex gap-3 pb-3 last:pb-0 animate-rowIn" style={{ animationDelay: `${i * 90}ms` }}>
              {i < hopData.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-white/10" />}
              <span className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${i === 0 ? 'border-risk-critical bg-risk-critical/40' : h.odd ? 'border-risk-high bg-ink-900' : 'border-accent bg-ink-900'}`} />
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-slate-200">{h.server}</p>
                <p className="text-xs text-slate-500">
                  {i === 0 ? 'Origin hop · ' : ''}{fmtTime(h.timestamp)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
