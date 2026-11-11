import { DEFAULT_CATEGORY, PORTFOLIO } from './data';
import type { CategoryKey, PhotoSet, Project } from './types';

/**
 * Vị trí đang xem trong trang portfolio.
 *  - Tab Công nghiệp / Chuyên nghiệp: danh sách bộ ảnh → ảnh của bộ ảnh (setId)
 *  - Tab Project: danh sách project → bộ ảnh của project (projectId) → ảnh của bộ ảnh (setId)
 */
export interface Route {
  cat: CategoryKey;
  projectId: string | null;
  setId: string | null;
}

/** Tạo query string, vd "?cat=projects&project=su-kien&set=hoi-nghi". */
export const buildQuery = ({ cat, projectId, setId }: Route): string => {
  let q = `?cat=${cat}`;
  if (projectId) q += `&project=${projectId}`;
  if (setId) q += `&set=${setId}`;
  return q;
};

/** Link tới trang portfolio (dùng từ trang chủ). */
export const portfolioHref = (route: Route): string => `portfolio.html${buildQuery(route)}`;

/** Tìm project và bộ ảnh tương ứng với route (id sai thì bỏ qua). */
export const resolveRoute = (route: Route): { project?: Project; set?: PhotoSet } => {
  const category = PORTFOLIO[route.cat];
  if (category.kind === 'sets') {
    return { set: category.sets.find((s) => s.id === route.setId) };
  }
  if (category.kind === 'projects') {
    const project = category.projects.find((p) => p.id === route.projectId);
    return { project, set: project?.sets.find((s) => s.id === route.setId) };
  }
  return {};
};

/** Đọc route từ URL; id sai/không tồn tại thì tự lùi về cấp cha. */
export const readRoute = (search: string = window.location.search): Route => {
  const params = new URLSearchParams(search);
  const c = params.get('cat');
  const cat: CategoryKey = c && c in PORTFOLIO ? (c as CategoryKey) : DEFAULT_CATEGORY;
  const { project, set } = resolveRoute({
    cat,
    projectId: params.get('project'),
    setId: params.get('set'),
  });
  return { cat, projectId: project?.id ?? null, setId: set?.id ?? null };
};
