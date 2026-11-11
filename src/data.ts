/*
 * DỮ LIỆU NỘI DUNG — đọc từ các file JSON trong thư mục content/.
 * Khách hàng sửa các file này qua trang /admin (Decap CMS); bạn cũng có thể sửa tay.
 *
 *   content/profile.json    hồ sơ, phần "Về mình"
 *   content/settings.json   số mục nổi bật, tab mặc định
 *   content/contact.json    mạng xã hội, liên hệ
 *   content/industrial.json Công nghiệp  (danh sách bộ ảnh)
 *   content/pro.json        Chuyên nghiệp (danh sách bộ ảnh)
 *   content/projects.json   Project      (project → bộ ảnh)
 *   content/bts.json        Video hậu trường
 *
 * File này chỉ làm việc "chuẩn hoá": tạo id từ tên, ảnh giữ chỗ khi chưa có ảnh thật...
 * Thứ tự các tab nằm ở khối PORTFOLIO bên dưới.
 */
import profileJson from '../content/profile.json';
import settingsJson from '../content/settings.json';
import contactJson from '../content/contact.json';
import proJson from '../content/pro.json';
import industrialJson from '../content/industrial.json';
import projectsJson from '../content/projects.json';
import btsJson from '../content/bts.json';
import type {
  Category,
  CategoryKey,
  Contact,
  PhotoItem,
  PhotoSet,
  Profile,
  Project,
  ProjectCategory,
  SetCategory,
  SocialLink,
  VideoCategory,
  VideoItem,
} from './types';

/* ---------- Kiểu "thô" của các file JSON (mọi trường đều có thể thiếu) ---------- */
interface RawPhoto { src?: string; title?: string }
interface RawSet { title?: string; desc?: string; featured?: boolean; cover?: string; photos?: RawPhoto[] }
interface RawProject { title?: string; desc?: string; featured?: boolean; cover?: string; sets?: RawSet[] }
interface RawVideo { title?: string; desc?: string; duration?: string; thumb?: string; youtubeId?: string; src?: string }
interface RawSets { label?: string; desc?: string; sets?: RawSet[] }
interface RawProjects { label?: string; desc?: string; projects?: RawProject[] }
interface RawVideos { label?: string; desc?: string; videos?: RawVideo[] }

/* ---------- Tiện ích chuẩn hoá ---------- */

/** "Chân dung doanh nhân" → "chan-dung-doanh-nhan" (dùng làm id / đường dẫn). */
const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'muc';

/** Tạo id duy nhất cho một danh sách tiêu đề (trùng tên thì thêm -2, -3...). */
const makeIds = (titles: string[]): string[] => {
  const seen = new Map<string, number>();
  return titles.map((t) => {
    const base = slugify(t);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
};

/** Màu cố định theo chữ, dùng cho khung giữ chỗ khi chưa có ảnh. */
const hueOf = (s: string): number => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

const PLACEHOLDER_RATIOS = [1.5, 0.8, 1.33, 1, 0.75, 1.78];

const toPhoto = (raw: RawPhoto, setTitle: string, i: number, hue: number): PhotoItem => {
  const src = raw.src?.trim() ?? '';
  return {
    src,
    title: raw.title?.trim() || `${setTitle} ${i + 1}`,
    hue: (hue + i * 8) % 360,
    // Tỉ lệ chỉ dùng cho khung giữ chỗ; ảnh thật phải giữ tỉ lệ gốc
    ratio: src ? undefined : PLACEHOLDER_RATIOS[i % PLACEHOLDER_RATIOS.length],
  };
};

const toCover = (src: string | undefined, title: string): PhotoItem | undefined =>
  src?.trim() ? { src: src.trim(), title } : undefined;

const buildSets = (raws: RawSet[]): PhotoSet[] => {
  const titles = raws.map((s) => s.title?.trim() || 'Bộ ảnh');
  const ids = makeIds(titles);
  return raws.map((s, i) => {
    const title = titles[i];
    const hue = hueOf(title);
    return {
      id: ids[i],
      title,
      desc: s.desc ?? '',
      featured: !!s.featured,
      cover: toCover(s.cover, title),
      photos: (s.photos ?? []).map((p, n) => toPhoto(p, title, n, hue)),
    };
  });
};

const buildProjects = (raws: RawProject[]): Project[] => {
  const titles = raws.map((p) => p.title?.trim() || 'Project');
  const ids = makeIds(titles);
  return raws.map((p, i) => ({
    id: ids[i],
    title: titles[i],
    desc: p.desc ?? '',
    featured: !!p.featured,
    cover: toCover(p.cover, titles[i]),
    sets: buildSets(p.sets ?? []),
  }));
};

const buildVideos = (raws: RawVideo[]): VideoItem[] => {
  const titles = raws.map((v) => v.title?.trim() || 'Video');
  const ids = makeIds(titles);
  return raws.map((v, i) => ({
    id: ids[i],
    title: titles[i],
    desc: v.desc ?? '',
    duration: v.duration?.trim() || undefined,
    thumb: v.thumb?.trim() || undefined,
    youtubeId: v.youtubeId?.trim() || undefined,
    src: v.src?.trim() || undefined,
    hue: hueOf(titles[i]),
  }));
};

const setCategory = (raw: RawSets): SetCategory => ({
  kind: 'sets',
  label: raw.label ?? '',
  desc: raw.desc ?? '',
  sets: buildSets(raw.sets ?? []),
});

/* ---------- Hồ sơ, liên hệ, cài đặt ---------- */
export const PROFILE: Profile = profileJson as unknown as Profile;

export const SOCIALS: SocialLink[] = (contactJson as unknown as { socials: SocialLink[] }).socials;

export const CONTACT: Contact = {
  messenger: contactJson.messenger,
  phone: contactJson.phone,
  phoneHref: contactJson.phoneHref,
  email: contactJson.email,
};

/** Số bộ ảnh / project / video nổi bật hiện ở trang chủ cho mỗi tab. */
export const FEATURED_COUNT: number = Math.max(1, Number(settingsJson.featuredCount) || 4);

/* ---------- Portfolio ---------- */

/**
 * Cấu trúc:
 *   - Công nghiệp, Chuyên nghiệp (kind 'sets'): Tab → Bộ ảnh → Ảnh
 *   - Project (kind 'projects'):                Tab → Project → Bộ ảnh → Ảnh
 *   - Video hậu trường (kind 'video'):          Tab → Video
 * Thứ tự các tab = thứ tự khai báo bên dưới. Muốn đổi thì kéo dòng lên/xuống.
 */
export const PORTFOLIO: Record<CategoryKey, Category> = {
  projects: {
    kind: 'projects',
    label: (projectsJson as RawProjects).label ?? '',
    desc: (projectsJson as RawProjects).desc ?? '',
    projects: buildProjects((projectsJson as RawProjects).projects ?? []),
  } satisfies ProjectCategory,
  industrial: setCategory(industrialJson as RawSets),
  pro: setCategory(proJson as RawSets),
  bts: {
    kind: 'video',
    label: (btsJson as RawVideos).label ?? '',
    desc: (btsJson as RawVideos).desc ?? '',
    videos: buildVideos((btsJson as RawVideos).videos ?? []),
  } satisfies VideoCategory,
};

/** Tab được chọn sẵn khi mở trang (cài ở content/settings.json). */
export const DEFAULT_CATEGORY: CategoryKey =
  settingsJson.defaultCategory in PORTFOLIO
    ? (settingsJson.defaultCategory as CategoryKey)
    : (Object.keys(PORTFOLIO)[0] as CategoryKey);

/** Lấy tối đa FEATURED_COUNT phần tử: ưu tiên phần tử có featured, nếu không có thì lấy từ đầu. */
const pickFeatured = <T extends { featured?: boolean }>(list: T[]): T[] => {
  const flagged = list.filter((x) => x.featured);
  return (flagged.length ? flagged : list).slice(0, FEATURED_COUNT);
};

/** Bộ ảnh nổi bật ở trang chủ (tab Công nghiệp / Chuyên nghiệp). */
export const getFeaturedSets = (cat: SetCategory): PhotoSet[] => pickFeatured(cat.sets);

/** Project nổi bật ở trang chủ (tab Project). */
export const getFeaturedProjects = (cat: ProjectCategory): Project[] => pickFeatured(cat.projects);

/** Video hiện ở trang chủ: FEATURED_COUNT video đầu. */
export const getFeaturedVideos = (cat: VideoCategory): VideoItem[] => cat.videos.slice(0, FEATURED_COUNT);

/** Khung giữ chỗ cho mục chưa có ảnh nào. */
const emptyCover = (title: string): PhotoItem => ({ src: '', title, hue: hueOf(title), ratio: 1 });

/** Ảnh bìa của một bộ ảnh: `cover` riêng, nếu không có thì ảnh đầu tiên. */
export const setCover = (set: PhotoSet): PhotoItem => set.cover ?? set.photos[0] ?? emptyCover(set.title);

/** Ảnh bìa của project: `cover` riêng, nếu không có thì lấy bìa bộ ảnh đầu tiên. */
export const projectCover = (p: Project): PhotoItem =>
  p.cover ?? (p.sets[0] ? setCover(p.sets[0]) : emptyCover(p.title));

/** Tổng số ảnh trong project. */
export const projectPhotoCount = (p: Project): number => p.sets.reduce((n, s) => n + s.photos.length, 0);
