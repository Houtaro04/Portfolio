import Media from './Media';
import Reveal from './Reveal';
import { PROFILE } from '../data';

export default function About() {
  return (
    <section className="section" id="about">
      <Reveal className="section-head" variant="left">
        <p className="eyebrow">Về mình</p>
        <h2>Người đứng sau<br />ống kính.</h2>
      </Reveal>

      <div className="about-grid">
        <Reveal as="figure" variant="left" className="about-img">
          <Media
            fill
            label="Ảnh đời thường"
            item={{ src: PROFILE.aboutImage, title: PROFILE.name, hue: 200 }}
          />
        </Reveal>

        <Reveal variant="stagger" className="about-body">
          {PROFILE.about.map((p, i) => <p key={i}>{p}</p>)}
          <ul className="stats">
            {PROFILE.stats.map((s) => (
              <li key={s.label}><b>{s.value}</b><span>{s.label}</span></li>
            ))}
          </ul>
          <ul className="tags">
            {PROFILE.tags.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
