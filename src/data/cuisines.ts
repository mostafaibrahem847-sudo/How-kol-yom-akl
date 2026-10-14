// Browse-by-cuisine catalog data — the single source of truth for the Home
// cuisine row. The ids match the live `public.recipes.cuisine` values and the
// Cloudinary public_ids (`cuisine-images/<id>`); the images are the 7 uploaded
// card photos (see output/cuisine-image-urls.json). Nothing here is duplicated
// inline in a component.

export type CuisineId =
  | 'egyptian'
  | 'gulf'
  | 'moroccan'
  | 'turkish'
  | 'asian'
  | 'global'
  | 'levantine';

export type Cuisine = {
  id: CuisineId;
  titleAr: string;
  imageUrl: string;
};

export const cuisines: Cuisine[] = [
  {
    id: 'egyptian',
    titleAr: 'المطبخ المصري',
    imageUrl: 'https://res.cloudinary.com/decj37mm0/image/upload/v1791974645/cuisine-images/egyptian.jpg',
  },
  {
    id: 'gulf',
    titleAr: 'المطبخ الخليجي',
    imageUrl: 'https://res.cloudinary.com/decj37mm0/image/upload/v1791974657/cuisine-images/gulf.jpg',
  },
  {
    id: 'moroccan',
    titleAr: 'المطبخ المغربي',
    imageUrl: 'https://res.cloudinary.com/decj37mm0/image/upload/v1791974659/cuisine-images/moroccan.jpg',
  },
  {
    id: 'turkish',
    titleAr: 'المطبخ التركي',
    imageUrl: 'https://res.cloudinary.com/decj37mm0/image/upload/v1791974667/cuisine-images/turkish.jpg',
  },
  {
    id: 'asian',
    titleAr: 'المطبخ الآسيوي',
    imageUrl: 'https://res.cloudinary.com/decj37mm0/image/upload/v1791974675/cuisine-images/asian.jpg',
  },
  {
    id: 'global',
    titleAr: 'المطبخ العالمي',
    imageUrl: 'https://res.cloudinary.com/decj37mm0/image/upload/v1791974683/cuisine-images/global.jpg',
  },
  {
    id: 'levantine',
    titleAr: 'المطبخ الشامي',
    imageUrl: 'https://res.cloudinary.com/decj37mm0/image/upload/v1791976090/cuisine-images/levantine.jpg',
  },
];
