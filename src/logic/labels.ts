export function formatCategoryLabel(category: string): string {
  if (!category) return category;
  return category.charAt(0).toUpperCase() + category.slice(1);
}
