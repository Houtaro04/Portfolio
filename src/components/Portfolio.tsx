import { useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import CoverCard from './CoverCard';
import Lines from './Lines';
import Reveal from './Reveal';
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';
import { isLite, prefersReducedMotion } from '../boot';
import {
  HOME_ORDER,
  PORTFOLIO,
  getFeaturedProjects,
  getFeaturedSets,
  getFeaturedVideos,
  projectCover,
  projectPhotoCount,
  setCover,
} from '../data';
import { useHorizontalPin } from '../hooks';
import { portfolioHref } from '../routes';
import { infoFromCard, transitionNavigate } from '../transition';
import type { Category, VideoItem } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Thông tin hiện ở chữ lớn giữa màn hình cho từng điểm dừng của dải. */
interface Stop {
  title: string;
  label: string;
}

const countOf = (c: Category): { n: number; unit: string } =>
  c.kind === 'sets'
    ? { n: c.sets.length, unit: 'bộ ảnh' }
    : c.kind === 'projects'
      ? { n: c.projects.length, unit: 'project' }
      : { n: c.videos.length, unit: 'video' };

/**
 * Mục Sản phẩm ở trang chủ: MỘT dải duy nhất cuộn ngang, lần lượt album nổi bật của từng phần theo HOME_ORDER
 * (Chuyên nghiệp → Project → Công nghiệp → Video hậu trường), cuối cùng là thẻ "Xem thêm".
 * Tên các phần nằm thành một hàng ngay dưới chữ "Sản phẩm" (không nằm trong dải): phần đang xem được tô sáng, bấm vào tên
 * phần để nhảy tới album đầu của phần đó.
 * Cuộn chuột bình thường: mục này ghim trên màn hình, mỗi lần cuộn chỉ nhảy sang đúng một album bên cạnh (xem
 * useHorizontalPin); xem hết rồi trang mới cuộn xuống tiếp.
 * Trên máy tính còn có: thẻ ở giữa được nhấn mạnh, ảnh trượt lệch tốc độ, thẻ nghiêng theo tốc độ và tên mục ở giữa hiện
 * thành chữ khổng lồ trộn màu với ảnh (kiểu antiantiart).
 * Bấm vào thẻ → chuyển cảnh lưới ảnh rồi sang trang portfolio.html.
 */
export default function Portfolio() {
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [active, setActive] = useState(0); // điểm dừng đang ở gần tâm màn hình nhất

  const enhanced = !isLite && !prefersReducedMotion;
  const outer = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const control = useRef<((index: number) => void) | null>(null); // lệnh nhảy tới điểm dừng (do useHorizontalPin đặt)
  const span = useHorizontalPin(outer, viewport, track, bar, 'home', enhanced, setActive, control);

  const nodes: ReactNode[] = [];
  const stops: Stop[] = [];
  const groupOf: number[] = []; // điểm dừng i thuộc phần nào (-1 = thẻ "Xem thêm")
  const starts: number[] = []; // điểm dừng đầu tiên của mỗi phần

  HOME_ORDER.forEach((cat, g) => {
    const category = PORTFOLIO[cat];
    starts.push(stops.length);

    const add = (node: ReactNode, title: string, i: number, total: number) => {
      nodes.push(node);
      stops.push({ title, label: `${category.label} · ${pad(i + 1)} / ${pad(total)}` });
      groupOf.push(g);
    };

    if (category.kind === 'sets') {
      const list = getFeaturedSets(category);
      list.forEach((s, i) =>
        add(
          <CoverCard
            key={`${cat}-${s.id}`}
            index={i}
            cover={setCover(s)}
            title={s.title}
            meta={`${s.photos.length} ảnh`}
            href={portfolioHref({ cat, projectId: null, setId: s.id })}
          />,
          s.title,
          i,
          list.length
        )
      );
    } else if (category.kind === 'projects') {
      const list = getFeaturedProjects(category);
      list.forEach((p, i) =>
        add(
          <CoverCard
            key={`${cat}-${p.id}`}
            index={i}
            cover={projectCover(p)}
            title={p.title}
            meta={`${p.sets.length} bộ ảnh · ${projectPhotoCount(p)} ảnh`}
            href={portfolioHref({ cat, projectId: p.id, setId: null })}
          />,
          p.title,
          i,
          list.length
        )
      );
    } else {
      const list = getFeaturedVideos(category);
      list.forEach((v, i) =>
        add(<VideoCard key={`${cat}-${v.id}`} video={v} index={i} onOpen={() => setVideo(v)} />, v.title, i, list.length)
      );
    }
  });

  // Thẻ cuối: xem tất cả
  const moreHref = portfolioHref({ cat: HOME_ORDER[0], projectId: null, setId: null });
  nodes.push(
    <a
      className="rail-more"
      key="more"
      data-cursor="Mở"
      href={moreHref}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        void transitionNavigate(infoFromCard(e.currentTarget, 'Tất cả sản phẩm', 'Portfolio'), moreHref);
      }}
    >
      <small>Xem thêm</small>
      <b>Tất cả sản phẩm</b>
      <span aria-hidden="true">→</span>
    </a>
  );
  stops.push({ title: 'Xem thêm', label: 'Tất cả sản phẩm' });
  groupOf.push(-1);

  const current = Math.min(active, stops.length - 1);
  const activeGroup = groupOf[current];
  const activeCat = activeGroup >= 0 ? HOME_ORDER[activeGroup] : null;
  const activeCategory = activeCat ? PORTFOLIO[activeCat] : null;
  const allHref = portfolioHref({ cat: activeCat ?? HOME_ORDER[0], projectId: null, setId: null });
  const allUnit = activeCategory ? countOf(activeCategory).unit : 'sản phẩm';

  return (
    // outer: khối cao = 1 màn hình + quãng cuộn cho mọi điểm dừng; bên trong .pin-sticky đứng yên trên màn hình
    <section className="pin" id="portfolio" ref={outer} style={{ height: `calc(100svh + ${span}px)` }}>
      <div className="pin-sticky section-portfolio">
        <div className="pf-bar">
          <Reveal className="section-head" variant="none">
            <p className="eyebrow">Portfolio</p>
            <h2><Lines lines={['Sản phẩm.']} /></h2>
          </Reveal>

          {/* Tên các phần ngay dưới chữ "Sản phẩm": phần đang xem được tô sáng, bấm để nhảy tới album đầu của phần */}
          <nav className="pf-groups" aria-label="Các phần sản phẩm">
            {HOME_ORDER.map((cat, g) => (
              <button
                key={cat}
                type="button"
                className={`pf-group${g === activeGroup ? ' is-active' : ''}`}
                aria-current={g === activeGroup ? 'true' : undefined}
                data-cursor="Xem"
                onClick={() => control.current?.(starts[g])}
              >
                {PORTFOLIO[cat].label}
                <small>{countOf(PORTFOLIO[cat]).n}</small>
              </button>
            ))}
            <a
              className="pf-all"
              href={allHref}
              data-cursor="Mở"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                const cards = track.current?.querySelectorAll<HTMLElement>(':scope > .item, :scope > .rail-more');
                const from = (cards && (cards[starts[Math.max(0, activeGroup)]] ?? cards[0])) || e.currentTarget;
                void transitionNavigate(infoFromCard(from, `Tất cả ${allUnit}`, activeCategory?.label ?? 'Portfolio'), allHref);
              }}
            >
              Xem tất cả {allUnit} <span aria-hidden="true">→</span>
            </a>
          </nav>
          <p className="pf-desc">{activeCategory ? activeCategory.desc : 'Xem toàn bộ ảnh, project và video ở trang portfolio.'}</p>
        </div>

        <div className="hrail" ref={viewport}>
          <div className="hrail-track" ref={track}>
            {nodes}
          </div>
        </div>
        <div className="rail-progress" aria-hidden="true">
          <span ref={bar} />
        </div>

        {/* Tên mục ở giữa màn hình hiện thành chữ khổng lồ trộn màu với ảnh phía sau (chỉ máy tính) */}
        {enhanced && (
          <div className="pin-title" aria-hidden="true">
            <span className="pin-count">{stops[current].label}</span>
            {/* --len: số ký tự, để CSS tự co cỡ chữ cho tên luôn vừa một dòng */}
            <span className="pin-name" key={current} style={{ '--len': Math.max(8, stops[current].title.length) } as CSSProperties}>
              {stops[current].title}
            </span>
          </div>
        )}

        {video && <VideoModal video={video} onClose={() => setVideo(null)} />}
      </div>
    </section>
  );
}
