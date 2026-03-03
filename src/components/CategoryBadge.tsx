import { Category, CATEGORY_BADGE, CATEGORY_ICONS } from '@/types/expense';

interface Props {
  category: Category;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'sm' }: Props) {
  const sizeClass = size === 'md' ? 'gap-1 px-2.5' : 'gap-0.5 px-2';
  return (
    <span
      className={`inline-flex items-center ${sizeClass} py-0.5 rounded-full text-xs font-medium border ${CATEGORY_BADGE[category]}`}
    >
      {CATEGORY_ICONS[category]} {category}
    </span>
  );
}
