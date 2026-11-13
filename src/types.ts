/** Một ảnh trong portfolio (hoặc ảnh đơn lẻ như chân dung). */
export interface PhotoItem {
  /** Đường dẫn ảnh trong public/, vd "images/industrial/01.jpg". "" = hiện khung giữ chỗ. */
  src: string;
  title: string;
  /** Tỉ lệ rộng/cao cho ảnh giữ chỗ (1.5 = ngang, 0.8 = dọc). */
  ratio?: number;
  /** Màu ảnh giữ chỗ, 0–360. */
  hue?: number;
}

export type CategoryKey = 'industrial' | 'pro' | 'projects' | 'bts';

/** Một video (hậu trường). Dùng youtubeId HOẶC src (file mp4 trong public/). */
export interface VideoItem {
  id: string;
  title: string;
  desc?: string;
  /** Ảnh thumbnail trong public/, vd "images/bts/setup.jpg". Bỏ trống = khung giữ chỗ. */
  thumb?: string;
  /** ID video YouTube, vd "dQw4w9WgXcQ". */
  youtubeId?: string;
  /** Đường dẫn file video, vd "videos/setup.mp4". */
  src?: string;
  /** Thời lượng hiển thị, vd "2:35". */
  duration?: string;
  hue?: number;
}

/** Một bộ ảnh: nhóm các ảnh liên quan trong một project. */
export interface PhotoSet {
  id: string;
  title: string;
  desc?: string;
  /** true = hiện ở mục Portfolio trang chủ (với tab Công nghiệp / Chuyên nghiệp). */
  featured?: boolean;
  /** Ảnh bìa; bỏ trống thì dùng ảnh đầu tiên của bộ. */
  cover?: PhotoItem;
  photos: PhotoItem[];
}

/** Một project gồm nhiều bộ ảnh. */
export interface Project {
  id: string;
  title: string;
  desc: string;
  /** true = hiện ở mục Portfolio trang chủ (tối đa FEATURED_COUNT project nổi bật mỗi nhóm). */
  featured?: boolean;
  /** Ảnh bìa; bỏ trống thì dùng ảnh bìa của bộ ảnh đầu tiên. */
  cover?: PhotoItem;
  sets: PhotoSet[];
}

/** Nhóm chứa thẳng các bộ ảnh (Công nghiệp, Chuyên nghiệp). */
export interface SetCategory {
  kind: 'sets';
  label: string;
  desc: string;
  sets: PhotoSet[];
}

/** Nhóm chứa các project (mỗi project gồm nhiều bộ ảnh). */
export interface ProjectCategory {
  kind: 'projects';
  label: string;
  desc: string;
  projects: Project[];
}

/** Nhóm video: danh sách video. */
export interface VideoCategory {
  kind: 'video';
  label: string;
  desc: string;
  videos: VideoItem[];
}

export type Category = SetCategory | ProjectCategory | VideoCategory;

export interface Stat {
  value: string;
  label: string;
}

export interface Profile {
  name: string;
  /** Tên đầy đủ dùng cho alt của logo và dòng bản quyền. */
  fullName: string;
  aboutImage: string;
  about: string[];
  stats: Stat[];
  tags: string[];
}

export interface SocialLink {
  name: string;
  desc: string;
  handle: string;
  href: string;
}

export interface Contact {
  /** Ảnh lớn bên phải phần liên hệ ở cuối trang (đường dẫn trong public/). */
  image?: string;
  messenger: string;
  phone: string;
  phoneHref: string;
  email: string;
}
