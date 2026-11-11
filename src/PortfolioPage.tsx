import { useEffect, useState } from 'react';
import CategoryTabs from './components/CategoryTabs';
import CoverCard from './components/CoverCard';
import GalleryItem from './components/GalleryItem';
import Lightbox from './components/Lightbox';
import Logo from './components/Logo';
import Reveal from './components/Reveal';
import VideoCard from './components/VideoCard';
import VideoModal from './components/VideoModal';
import Footer from './components/Footer';
import { PORTFOLIO, projectCover, projectPhotoCount, setCover } from './data';
import { useScrollProgress } from './hooks';
import { buildQuery, readRoute, resolveRoute } from './routes';
import type { Route } from './routes';
import type { VideoItem } from './types';

/**
 * Trang riêng chỉ hiển thị portfolio.
 *  - Công nghiệp / Chuyên nghiệp:  danh sách bộ ảnh → toàn bộ ảnh của bộ ảnh
 *  - Project:                      danh sách project → các bộ ảnh của project → toàn bộ ảnh của bộ ảnh
 *  - Video hậu trường:             danh sách video (bấm để xem)
 * Vị trí nằm trong URL (?cat=&project=&set=) nên chia sẻ link và nút Back đều hoạt động.
 */
export default function PortfolioPage() {
  useScrollProgress();
  const [route, setRoute] = useState<Route>(() => readRoute());
  const [view, setView] = useState<number | null>(null); // index ảnh đang mở trong lightbox
  const [video, setVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    const onPop = () => {
      setRoute(readRoute());
      setView(null);
      setVideo(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (next: Route) => {
    window.history.pushState(null, '', buildQuery(next));
    setRoute(next);
    setView(null);
    setVideo(null);
    window.scrollTo(0, 0);
  };

  const { cat } = route;
  const category = PORTFOLIO[cat];
  const { project, set } = resolveRoute(route);

  let body;
  if (set) {
    /* ---------- Toàn bộ ảnh của một bộ ảnh ---------- */
    const backTo: Route = project ? { cat, projectId: project.id, setId: null } : { cat, projectId: null, setId: null };
    const backLabel = project ? project.title : `Tất cả bộ ảnh · ${category.label}`;
    body = (
      <div key={`${project?.id ?? ''}/${set.id}`}>
        <button className="back back-btn" onClick={() => go(backTo)}>
          <span aria-hidden="true">←</span> {backLabel}
        </button>

        <Reveal className="album-head" variant="left">
          <p className="eyebrow">{project ? project.title : category.label}</p>
          <h1 className="pf-title">{set.title}</h1>
          {set.desc && <p>{set.desc}</p>}
          <span className="album-count">{set.photos.length} ảnh</span>
        </Reveal>

        <div className="gallery">
          {set.photos.map((photo, i) => (
            <GalleryItem key={i} item={photo} index={i} onOpen={() => setView(i)} />
          ))}
        </div>

        {view !== null && (
          <Lightbox items={set.photos} index={view} onChange={setView} onClose={() => setView(null)} />
        )}
      </div>
    );
  } else if (project) {
    /* ---------- Các bộ ảnh của một project ---------- */
    body = (
      <div key={project.id}>
        <button className="back back-btn" onClick={() => go({ cat, projectId: null, setId: null })}>
          <span aria-hidden="true">←</span> Tất cả project
        </button>

        <Reveal className="album-head" variant="left">
          <p className="eyebrow">Project</p>
          <h1 className="pf-title">{project.title}</h1>
          <p>{project.desc}</p>
          <span className="album-count">{project.sets.length} bộ ảnh · {projectPhotoCount(project)} ảnh</span>
        </Reveal>

        <div className="albums">
          {project.sets.map((s, i) => (
            <CoverCard
              key={s.id}
              index={i}
              cover={setCover(s)}
              title={s.title}
              meta={`${s.photos.length} ảnh`}
              href={buildQuery({ cat, projectId: project.id, setId: s.id })}
              onNavigate={() => go({ cat, projectId: project.id, setId: s.id })}
            />
          ))}
        </div>
      </div>
    );
  } else {
    /* ---------- Danh sách của tab: bộ ảnh / project / video ---------- */
    let list;
    let headline;
    if (category.kind === 'sets') {
      headline = <>Tất cả<br /><em>bộ ảnh.</em></>;
      list = category.sets.map((s, i) => (
        <CoverCard
          key={s.id}
          index={i}
          cover={setCover(s)}
          title={s.title}
          meta={`${s.photos.length} ảnh`}
          href={buildQuery({ cat, projectId: null, setId: s.id })}
          onNavigate={() => go({ cat, projectId: null, setId: s.id })}
        />
      ));
    } else if (category.kind === 'projects') {
      headline = <>Tất cả<br /><em>project.</em></>;
      list = category.projects.map((p, i) => (
        <CoverCard
          key={p.id}
          index={i}
          cover={projectCover(p)}
          title={p.title}
          meta={`${p.sets.length} bộ ảnh · ${projectPhotoCount(p)} ảnh`}
          href={buildQuery({ cat, projectId: p.id, setId: null })}
          onNavigate={() => go({ cat, projectId: p.id, setId: null })}
        />
      ));
    } else {
      headline = <>Tất cả<br /><em>video.</em></>;
      list = category.videos.map((v, i) => (
        <VideoCard key={v.id} video={v} index={i} onOpen={() => setVideo(v)} />
      ));
    }

    body = (
      <>
        <Reveal className="section-head" variant="left">
          <p className="eyebrow">Portfolio</p>
          <h1 className="pf-title">{headline}</h1>
        </Reveal>

        <CategoryTabs value={cat} onChange={(key) => go({ cat: key, projectId: null, setId: null })} />
        <p className="tab-desc">{category.desc}</p>

        {/* key=cat để remount và chạy lại animation khi đổi tab */}
        <div className={`albums${category.kind === 'video' ? ' videos' : ''}`} key={cat}>
          {list}
        </div>
      </>
    );
  }

  return (
    <>
      <header className="topbar">
        <Logo href="./" />
        <a className="back" href="index.html#portfolio"><span aria-hidden="true">←</span> Về trang chủ</a>
      </header>

      <main className="pf-main">{body}</main>

      <Footer />

      {video && <VideoModal video={video} onClose={() => setVideo(null)} />}
    </>
  );
}
