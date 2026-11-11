import Reveal from './Reveal';
import { SOCIALS, CONTACT } from '../data';

export default function Social() {
  return (
    <section className="section section-social" id="social">
      <Reveal className="section-head" variant="left">
        <p className="eyebrow">Social</p>
        <h2>Follow the work.</h2>
      </Reveal>

      <div className="social-grid">
        {SOCIALS.map((s, i) => (
          <Reveal key={s.name} className="social-item">
            <a className="social-card" href={s.href} target="_blank" rel="noopener noreferrer">
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.name}</h3>
              <p>{s.desc}</p>
              <span className="handle">{s.handle} <i>↗</i></span>
            </a>
          </Reveal>
        ))}
      </div>

      <Reveal className="cta" id="contact">
        <div className="cta-text">
          <h3>Sẵn sàng bắt đầu?</h3>
          <p>Nhắn mình để trao đổi ý tưởng và báo giá cho dự án của bạn.</p>
        </div>
        <div className="actions">
          <a className="btn btn-solid" href={CONTACT.messenger} target="_blank" rel="noopener noreferrer">Nhắn Messenger</a>
          <a className="btn btn-ghost" href={CONTACT.phoneHref}>{CONTACT.phone}</a>
          <a className="btn btn-ghost" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </div>
      </Reveal>
    </section>
  );
}
