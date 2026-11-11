import { useState } from 'react';
import CategoryTabs from './CategoryTabs';
import CoverCard from './CoverCard';
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
import { portfolioHref } from '../routes';
import type { CategoryKey, VideoItem } from '../types';

/**
 * Mục Portfolio ở trang chủ: vài mục nổi bật của tab đang chọn.
 * Bấm vào thẻ → chuyển sang trang portfolio.html (bộ ảnh → xem ảnh; project → xem các bộ ảnh).
 */
export default function Portfolio() {
  const [cat, setCat] = useState<CategoryKey>(DEFAULT_CATEGORY);
  const [video, setVideo] = useState<VideoItem | null>(null);
  const category = PORTFOLIO[cat];

  const total =
    category.kind === 'sets' ? category.sets.length : category.kind === 'projects' ? category.projects.length : category.videos.length;
  const unit = category.kind === 'sets' ? 'bộ ảnh' : category.kind === 'projects' ? 'project' : 'video';

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
    <section className="section section-portfolio" id="portfolio">
      <Reveal className="section-head" variant="left">
        <p className="eyebrow">Portfolio</p>
        <h2>Sản phẩm.</h2>
      </Reveal>

      <CategoryTabs value={cat} onChange={(key) => { setCat(key); setVideo(null); }} />
      <p className="tab-desc">{category.desc}</p>

      {/* key=cat để remount và chạy lại animation khi đổi tab */}
      <div className={`albums${category.kind === 'video' ? ' videos' : ''}`} key={cat}>
        {cards}
      </div>

      <Reveal className="more">
        <a className="btn btn-ghost" href={portfolioHref({ cat, projectId: null, setId: null })}>
          Xem thêm · {total} {unit} <span aria-hidden="true">→</span>
        </a>
      </Reveal>

      {video && <VideoModal video={video} onClose={() => setVideo(null)} />}
    </section>
  );
}
