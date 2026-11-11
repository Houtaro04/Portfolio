import { PROFILE } from '../data';

/** Thanh footer mỏng, dính cố định ở mép dưới màn hình: bản quyền bên trái, "Since 2020" bên phải (chữ óng ánh như slogan). */
export default function Footer() {
  return (
    <footer className="footer">
      <p className="shimmer">© {PROFILE.fullName} Photography</p>
      <p className="shimmer gold">Since 2020</p>
    </footer>
  );
}
