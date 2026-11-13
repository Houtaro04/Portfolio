import { useRef, useState } from 'react';
import CategoryTabs from './CategoryTabs';
import CoverCard from './CoverCard';
import Lines from './Lines';
import Reveal from './Reveal';
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';
import {
  DEFAULT_CATEGORY,
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
import type { CategoryKey, VideoItem } from '../types';

/**
 * Mục Sản phẩm ở trang chủ: tiêu đề + tab ở một hàng, bên dưới là dải thẻ nổi bật.
 * Cuộn chuột bình thường: trong lúc mục này đang ghim trên màn hình, dải thẻ chạy sang ngang; xem hết rồi trang mới cuộn
 * xuống tiếp (xem useHorizontalPin).
 * Bấm vào thẻ → chuyển cảnh lưới ảnh rồi sang trang portfolio.html (bộ ảnh → xem ảnh; project → xem các bộ ảnh).
 */
export default function Portfolio() {
  const [cat, setCat] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [video, setVideo] = useState<VideoItem | null>(null);
  const category = PORTFOLIO[cat];

  const outer = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const distance = useHorizontalPin(outer, viewport, track, bar, cat);

  const total =
    category.kind === 'sets' ? category.sets.length : category.kind === 'projects' ? category.projects.length : category.videos.length;
  const unit = category.kind === 'sets' ? 'bộ ảnh' : category.kind === 'projects' ? 'project' : 'video';
  const moreHref = portfolioHref({ cat, projectId: null, setId: null });

  let cards;
  if (category.kind === 'sets') {
    cards = getFeaturedSets(category).map((s, i) => (
      <CoverCard
        key={s.id}
        index={i}
        cover={setCover(s)}
        title={s.title}
        meta={`${s.photos.length} ảnh`}
        href={portfolioHref({ cat, projectId: null, setId: s.id })}
      />
    ));
  } else if (category.kind === 'projects') {
    cards = getFeaturedProjects(category).map((p, i) => (
      <CoverCard
        key={p.id}
        index={i}
        cover={projectCover(p)}
        title={p.title}
        meta={`${p.sets.length} bộ ảnh · ${projectPhotoCount(p)} ảnh`}
        href={portfolioHref({ cat, projectId: p.id, setId: null })}
      />
    ));
  } else {
    cards = getFeaturedVideos(category).map((v, i) => (
      <VideoCard key={v.id} video={v} index={i} onOpen={() => setVideo(v)} />
    ));
  }

  return (
    // outer: khối cao = 1 màn hình + quãng đường ngang; bên trong .pin-sticky đứng yên trên màn hình
    <section className="pin" id="portfolio" ref={outer} style={{ height: `calc(100svh + ${distance}px)` }}>
      <div className="pin-sticky section-portfolio">
        <div className="pf-bar">
          <Reveal className="section-head" variant="none">
            <p className="eyebrow">Portfolio</p>
            <h2><Lines lines={['Sản phẩm.']} /></h2>
          </Reveal>
          <CategoryTabs value={cat} onChange={(key) => { setCat(key); setVideo(null); }} />
        </div>
        <p className="tab-desc">{category.desc}</p>

        <div className={`hrail${category.kind === 'video' ? ' videos' : ''}`} ref={viewport}>
          {/* key=cat để dựng lại dải khi đổi tab */}
          <div className="hrail-track" ref={track} key={cat}>
            {cards}
            <a
              className="rail-more"
              data-cursor="Mở"
              href={moreHref}
              onClick={(e) => {
                // Giữ nguyên hành vi mặc định khi mở tab mới (Ctrl/Cmd/Shift/chuột giữa)
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                void transitionNavigate(infoFromCard(e.currentTarget, `Tất cả ${unit}`, category.label), moreHref);
              }}
            >
              <small>Xem thêm</small>
              <b>{total} {unit}</b>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="rail-progress" aria-hidden="true">
          <span ref={bar} />
        </div>

        {video && <VideoModal video={video} onClose={() => setVideo(null)} />}
      </div>
    </section>
  );
}
