import type { CSSProperties } from 'react';
import Reveal from './Reveal';

/** Các tia lấp lánh quanh slogan: vị trí (% theo khung slogan), kích thước (px), độ trễ (s). */
const SPARKS = [
  { x: '3%', y: '4%', s: 16, d: 0, gold: false },
  { x: '38%', y: '-8%', s: 11, d: 0.9, gold: false },
  { x: '73%', y: '6%', s: 18, d: 1.7, gold: true },
  { x: '98%', y: '42%', s: 12, d: 0.5, gold: true },
  { x: '86%', y: '96%', s: 16, d: 2.1, gold: true },
  { x: '30%', y: '98%', s: 12, d: 1.3, gold: false },
  { x: '-2%', y: '64%', s: 14, d: 2.4, gold: true },
];

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden="true" />
      <Reveal variant="stagger" className="hero-text">
        <p className="eyebrow">Photographer</p>
        <h1>
          {SPARKS.map((p, i) => (
            <span
              key={i}
              className={`spark${p.gold ? ' gold' : ''}`}
              style={{ '--x': p.x, '--y': p.y, '--s': `${p.s}px`, '--d': `${p.d}s` } as CSSProperties}
              aria-hidden="true"
            >
              <i />
            </span>
          ))}
          <span className="shimmer">Không chỉ nhìn thấy</span>
          <br />
          <em>mà còn "cảm nhận".</em>
        </h1>
        <div className="actions">
          <a className="btn btn-solid" href="#portfolio">Xem portfolio</a>
          <a className="btn btn-ghost" href="#about">Về mình</a>
        </div>
      </Reveal>
    </section>
  );
}
