export interface CategoryItem {
  id_category: string;
  name: string;
  portals_array: string[];
}

export interface CategoriesModalProps {
  open: boolean;
  onClose: () => void;
  /** Already selected category names (e.g. from form) */
  selectedCategoryNames?: string[];
  /** Called when user confirms selection with the full list of categories */
  onSelectCategories: (categories: CategoryItem[]) => void;
}
