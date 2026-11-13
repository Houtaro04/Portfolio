import { useRef } from 'react';
import type { ReactElement } from 'react';
import { CONTACT, SOCIALS } from '../data';
import { asset, useCurtainReveal } from '../hooks';

/** Biểu tượng nét mảnh 20x20 cho từng loại liên hệ (khớp theo tên, không phân biệt hoa thường). */
const ICONS: Record<string, ReactElement> = {
  instagram: (
    <>
      <rect x="2.6" y="2.6" width="14.8" height="14.8" rx="4.6" />
      <circle cx="10" cy="10" r="3.5" />
      <circle cx="14.3" cy="5.7" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: <path d="M11.4 17v-6.1h2l.4-2.5h-2.4V6.9c0-.8.3-1.3 1.4-1.3h1.1V3.5c-.5-.1-1.2-.2-2-.2-2 0-3.3 1.2-3.3 3.3v1.8H6.6v2.5h2V17" />,
  tiktok: <path d="M11.2 3v8.6a2.6 2.6 0 1 1-2.6-2.6M11.2 3c.3 2.1 1.6 3.5 3.6 3.6" />,
  behance: (
    <>
      <path d="M2.6 5.4h4.1c1.4 0 2.2.8 2.2 1.9s-.8 1.8-2 1.9c1.5.1 2.5.9 2.5 2.3 0 1.5-1.1 2.6-2.9 2.6H2.6zM2.6 9.2h3.9M11.8 6.4h4.6M16.6 12.2c0-1.6-1-2.6-2.4-2.6s-2.4 1-2.4 2.7 1 2.8 2.4 2.8c1 0 1.8-.4 2.1-1.2" />
    </>
  ),
  messenger: (
    <>
      <path d="M10 2.9c-4 0-7 2.7-7 6.3 0 2 1 3.7 2.6 4.8V17l2.4-1.3c.6.2 1.3.3 2 .3 4 0 7-2.7 7-6.3S14 2.9 10 2.9z" />
      <path d="m6.4 11.1 2.5-2.7 1.9 1.6 2.8-2.6" />
    </>
  ),
  phone: <path d="M4.4 3.4h2.3l1.2 2.9-1.5 1.1a10.6 10.6 0 0 0 4.7 4.7l1.1-1.5 2.9 1.2v2.3c0 .7-.6 1.3-1.3 1.3A13.4 13.4 0 0 1 3.1 4.7c0-.7.6-1.3 1.3-1.3Z" />,
  email: (
    <>
      <rect x="2.6" y="4.6" width="14.8" height="10.8" rx="1.6" />
      <path d="m3.6 6.4 6.4 4.5 6.4-4.5" />
    </>
  ),
  link: <path d="m8 12 4-4M7.4 9.6 6 11a2.4 2.4 0 0 0 3.4 3.4l1.4-1.4M12.6 10.4 14 9a2.4 2.4 0 0 0-3.4-3.4L9.2 7" />,
};

const iconOf = (name: string): ReactElement => ICONS[name.trim().toLowerCase()] ?? ICONS.link;

interface Row {
  key: string;
  label: string;
  text: string;
  href: string;
  external: boolean;
  icon: ReactElement;
}

/** Gom mạng xã hội + Messenger + điện thoại + email thành các dòng liên hệ. */
const buildRows = (): Row[] => {
  const rows: Row[] = SOCIALS.map((s) => ({
    key: s.name,
    label: s.name,
    text: s.handle,
    href: s.href,
    external: true,
    icon: iconOf(s.name),
  }));
  if (CONTACT.messenger) {
    rows.push({ key: 'messenger', label: 'Messenger', text: 'Nhắn Messenger', href: CONTACT.messenger, external: true, icon: ICONS.messenger });
  }
  if (CONTACT.phone) {
    rows.push({ key: 'phone', label: 'Điện thoại', text: CONTACT.phone, href: CONTACT.phoneHref, external: false, icon: ICONS.phone });
  }
  if (CONTACT.email) {
    rows.push({ key: 'email', label: 'Email', text: CONTACT.email, href: `mailto:${CONTACT.email}`, external: false, icon: ICONS.email });
  }
  return rows;
};

const ROWS = buildRows();

/**
 * Phần Social + chân trang gộp làm một, kiểu "kéo rèm" của yhao.art:
 * khối liên hệ nằm cố định ở đáy màn hình phía sau, khi cuộn tới cuối thì nội dung phía trên cuộn đi để lộ nó,
 * chữ trượt lên và ảnh thu nhỏ dần theo mức lộ ra (biến --reveal, xem useCurtainReveal).
 * Khối trống `#social` ở cuối trang làm đích cho link neo và quyết định chiều cao phần lộ ra.
 */
export default function Contact() {
  const spacer = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  useCurtainReveal(spacer, panel);

  return (
    <>
      <div id="social" className="contact-spacer" ref={spacer} aria-hidden="true" />
      <section className="contact" ref={panel} aria-label="Liên hệ">
        <div className="contact-inner">
          <div className="contact-copy">
            <p className="eyebrow">Liên hệ</p>
            <p className="contact-lead">Cần chụp ảnh sản phẩm, chân dung hay dự án thương hiệu? Liên hệ mình tại:</p>
            <ul className="contact-list">
              {ROWS.map((r) => (
                <li key={r.key}>
                  <a
                    className="contact-row"
                    href={r.href}
                    aria-label={r.label}
                    {...(r.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <svg viewBox="0 0 20 20" aria-hidden="true">{r.icon}</svg>
                    <span>{r.text}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {CONTACT.image && (
            <div className="contact-band">
              <img src={asset(CONTACT.image)} alt="" loading="lazy" />
            </div>
          )}
        </div>

        <div className="contact-foot">
          <p className="shimmer">© Kyle Hoang Photography</p>
          <p className="shimmer gold">Since 2020</p>
        </div>
      </section>
    </>
  );
}
