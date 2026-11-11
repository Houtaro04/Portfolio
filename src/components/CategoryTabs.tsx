import Reveal from './Reveal';
import { PORTFOLIO } from '../data';
import type { Category, CategoryKey } from '../types';

const CATEGORIES = Object.entries(PORTFOLIO) as [CategoryKey, Category][];

interface CategoryTabsProps {
  value: CategoryKey;
  onChange: (key: CategoryKey) => void;
}

/** Tab chuyển nhóm: Công nghiệp / Chuyên nghiệp. */
export default function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  return (
    <Reveal className="tabs" role="tablist">
      {CATEGORIES.map(([key, { label }]) => (
        <button
          key={key}
          role="tab"
          aria-selected={value === key}
          className={`tab${value === key ? ' is-active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </Reveal>
  );
}
