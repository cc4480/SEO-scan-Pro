import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './motionKit';

interface Node { x: number; y: number; vx: number; vy: number; r: number }
interface Pulse { a: number; b: number; t: number; speed: number }

const LINK_DIST = 150;
const MOUSE_DIST = 190;

/**
 * A drifting link graph — pages as nodes, links as edges — with bright "crawler" pulses that hop
 * along the edges and nodes that lean toward the cursor. Canvas 2D, DPR-aware, paused when
 * off-screen or the tab is hidden, and drawn once (static) for reduced-motion users.
 */
export default function ParticleField({ className = '', density = 1 }: { className?: string; density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, last = 0;
    let nodes: Node[] = [];
    const pulses: Pulse[] = [];
    const mouse = { x: -9999, y: -9999 };
    const still = prefersReducedMotion();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(16, Math.min(90, Math.round(((w * h) / 15000) * density)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: 1.2 + Math.random() * 1.8
      }));
      if (still) draw(0);
    };

    const spawnPulse = () => {
      if (pulses.length > 5) return;
      const a = Math.floor(Math.random() * nodes.length);
      let best = -1, bestD = LINK_DIST;
      for (let i = 0; i < nodes.length; i++) {
        if (i === a) continue;
        const d = Math.hypot(nodes[i].x - nodes[a].x, nodes[i].y - nodes[a].y);
        if (d < bestD && Math.random() < 0.5) { best = i; bestD = d; }
      }
      if (best >= 0) pulses.push({ a, b: best, t: 0, speed: 0.012 + Math.random() * 0.012 });
    };

    function draw(dt: number) {
      ctx!.clearRect(0, 0, w, h);
      for (const n of nodes) {
        if (!still) {
          const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
          if (d < MOUSE_DIST && d > 1) { n.vx += (dx / d) * 0.012; n.vy += (dy / d) * 0.012; }
          n.vx *= 0.985; n.vy *= 0.985;
          n.x += n.vx * dt * 0.06; n.y += n.vy * dt * 0.06;
          if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
          if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
        }
      }
      ctx!.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < LINK_DIST) {
            ctx!.strokeStyle = `rgba(125, 211, 252, ${(1 - d / LINK_DIST) * 0.22})`;
            ctx!.beginPath(); ctx!.moveTo(nodes[i].x, nodes[i].y); ctx!.lineTo(nodes[j].x, nodes[j].y); ctx!.stroke();
          }
        }
        const md = Math.hypot(mouse.x - nodes[i].x, mouse.y - nodes[i].y);
        if (md < MOUSE_DIST) {
          ctx!.strokeStyle = `rgba(52, 211, 153, ${(1 - md / MOUSE_DIST) * 0.55})`;
          ctx!.beginPath(); ctx!.moveTo(nodes[i].x, nodes[i].y); ctx!.lineTo(mouse.x, mouse.y); ctx!.stroke();
        }
      }
      for (const n of nodes) {
        ctx!.fillStyle = 'rgba(186, 230, 253, 0.75)';
        ctx!.beginPath(); ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx!.fill();
      }
      for (let p = pulses.length - 1; p >= 0; p--) {
        const s = pulses[p];
        s.t += s.speed * (dt / 16);
        if (s.t >= 1) { pulses.splice(p, 1); continue; }
        const x = nodes[s.a].x + (nodes[s.b].x - nodes[s.a].x) * s.t;
        const y = nodes[s.a].y + (nodes[s.b].y - nodes[s.a].y) * s.t;
        const g = ctx!.createRadialGradient(x, y, 0, x, y, 14);
        g.addColorStop(0, 'rgba(52, 211, 153, 0.95)'); g.addColorStop(1, 'rgba(52, 211, 153, 0)');
        ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(x, y, 14, 0, Math.PI * 2); ctx!.fill();
      }
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) { last = now; return; }
      const dt = Math.min(now - last || 16, 50); last = now;
      if (Math.random() < 0.03) spawnPulse();
      draw(dt);
    };

    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(canvas);
    const onMove = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    if (!still) {
      window.addEventListener('pointermove', onMove); window.addEventListener('pointerleave', onLeave);
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerleave', onLeave);
    };
  }, [density]);

  return <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full ${className}`} aria-hidden />;
}
