export type Recipe = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  category: string;
  categoryColor?: 'olive' | 'amber' | 'mint' | 'terracottaLight' | 'oliveDark';
  minutes: number;
  persons: number;
  difficulty?: 'سهلة' | 'متوسطة' | 'سريعة';
  rating?: number;
  audioAvailable?: boolean;
  audioUrl?: string;
  occasion?: string;
};

export type RecipeDetail = Recipe & {
  ingredients: { id: string; text: string }[];
  steps: { id: string; title: string; body: string; imageHint?: string }[];
  tips: { id: string; title: string; body: string }[];
};
