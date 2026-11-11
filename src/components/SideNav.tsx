import type { CSSProperties } from 'react';
import { useActiveSection } from '../hooks';
import Logo from './Logo';

const SECTIONS = [
  { id: 'top', label: 'Trang chủ' },
  { id: 'about', label: 'Về mình' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'social', label: 'Social' },
] as const;

const IDS: readonly string[] = SECTIONS.map((s) => s.id);

/** Menu dọc bên trái: chấm tròn; mục đang xem được highlight + phóng to. */
export default function SideNav() {
  const active = useActiveSection(IDS);

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Logo />
        </div>
      </header>
      <div className="progress" aria-hidden="true" />

      <nav className="side-nav" aria-label="Các mục trang">
        <ul>
          {SECTIONS.map(({ id, label }) => {
            const on = active === id;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={`side-link${on ? ' is-active' : ''}`}
                  aria-current={on ? 'true' : undefined}
                  aria-label={label}
                >
                  <span className="side-dot" />
                  <span className="side-label" data-text={label} aria-hidden="true">
                    {[...label].map((c, n) => (
                      <span key={n} className="ch" style={{ '--n': n } as CSSProperties}>{c}</span>
                    ))}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
