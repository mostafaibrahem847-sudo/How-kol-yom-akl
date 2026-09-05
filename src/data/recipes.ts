import { Recipe, RecipeDetail } from '../types/recipe';

const placeholders: Recipe[] = [
  {
    id: 'okra',
    title: 'طاجن بامية باللحمة الضاني',
    subtitle: 'مع الرز بالشعرية المفلفل والليمون المعصفر',
    description: 'بالطشة البلدي والليمون المعصفر، ريحة تجيب آخر الشارع',
    category: 'طواجن أصيلة',
    minutes: 45,
    persons: 5,
    difficulty: 'متوسطة',
    rating: 4.9,
    audioAvailable: true,
    occasion: 'محبوبة العيلة',
    categoryColor: 'olive',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'molokhia',
    title: 'ملوخية خضرا بالطشة مع فراخ محمرة',
    description: 'سر عِرق الملوخية المظبوط وطشة التوم بالكزبرة الناشفة اللي تجيب لآخر الشارع، مع فراخ مسلوقة ومتحمرة في السمنة البلدي.',
    category: 'أكلة الأسبوع',
    minutes: 35,
    persons: 4,
    difficulty: 'سهلة',
    audioAvailable: true,
    categoryColor: 'olive',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'kofta',
    title: 'كفتة الحاتي المشوية وسلطة طحينة',
    description: 'متبلة بتفل البصل وبهارات الحاتي، مشوية في فرن البوتاجاز مع فحمة تديكي ريحة وطراوة الجاهز بالظبط.',
    category: 'مشويات وسريعة',
    minutes: 25,
    persons: 4,
    difficulty: 'سريعة',
    audioAvailable: false,
    categoryColor: 'olive',
  },
  {
    id: 'bechamel',
    title: 'صينية مكرونة بالبشاميل المظبوطة',
    description: 'طبقات بشاميل كريمي سايح بدون تكتل، مع عصاج لحمة مفرومة بطماطم خفيفة وقشرة دهبية تفتح النفس.',
    category: 'عزومات ولمة',
    minutes: 50,
    persons: 6,
    difficulty: 'متوسطة',
    audioAvailable: false,
    categoryColor: 'olive',
  },
  {
    id: 'oxtail',
    title: 'طاجن عكاوي بالبصل القاورما',
    description: 'لحمة دايبة دوب وريحة هتقلب البيت كله بطريقة ست الكل.',
    category: 'مناسب للعزومات',
    minutes: 60,
    persons: 4,
    audioAvailable: true,
    occasion: 'مناسب للعزومات',
    categoryColor: 'olive',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'koshary',
    title: 'كشري مصري بيتي بالصلصة والدقة والتقلية',
    description: 'سر دقة المحلات والتقلية المقرمشة اللي بتفرقع من الجمال.',
    category: 'أكلة التوفير',
    minutes: 40,
    persons: 6,
    audioAvailable: true,
    occasion: 'أكلة التوفير',
    categoryColor: 'amber',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 'potatoChicken',
    title: 'صينية بطاطس بالفراخ ورز معمر',
    description: 'صينية الإنقاذ السريعة مع رز فلاحي بريحة السمنة البلدي.',
    category: 'سريعة وسهلة',
    minutes: 45,
    persons: 5,
    audioAvailable: true,
    occasion: 'سريعة وسهلة',
    categoryColor: 'mint',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    id: 'omAli',
    title: 'أم علي بالمكسرات والقشطة البلدي',
    description: 'وش مقرمش مكرمل وجواها طري غرقان باللبن والمكسرات.',
    category: 'حلو وسريع',
    minutes: 20,
    persons: 4,
    audioAvailable: false,
    occasion: 'حلو وسريع',
    categoryColor: 'terracottaLight',
  },
  {
    id: 'chickenPotato',
    title: 'صينية بطاطس بالفراخ المحمرة',
    description: 'البطاطس دايبة ومتبلة مع فراخ مقرمشة محمرة على أصولها.',
    category: 'غدا عائلي سريع',
    minutes: 40,
    persons: 5,
    rating: 4.8,
    audioAvailable: true,
    categoryColor: 'olive',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
  {
    id: 'hawawshi',
    title: 'حواوشي إسكندراني بالعجين',
    description: 'عجينة قطنية وهشة بحشوة اللحمة المتبلة مع رشة حبة البركة.',
    category: 'معجنات وحرشة',
    minutes: 30,
    persons: 4,
    rating: 5.0,
    audioAvailable: false,
    categoryColor: 'olive',
  },
];

export const placeholderRecipes = placeholders;

const fullDetails: Record<string, Omit<RecipeDetail, 'id' | 'minutes' | 'persons' | 'category' | 'description' | 'title'> & Partial<Pick<RecipeDetail, 'title' | 'description' | 'minutes' | 'persons' | 'category'>>> = {
  okra: {
    ingredients: [
      { id: 'i1', text: '١ كيلو بامية بلدي مقمعة طازة صغننة' },
      { id: 'i2', text: 'نصف كيلو لحمة ضاني مسلوقة نص سلقة مع الشوربة' },
      { id: 'i3', text: '٤ أكواب عصير طماطم فريش متسبكة تقيلة' },
      { id: 'i4', text: 'رأس توم بلدي مفروم مع قرن فلفل حامي أحمر' },
      { id: 'i5', text: '٢ ملعقة كبيرة سمنة بلدي بقري فلاحي' },
      { id: 'i6', text: 'ملعقة كزبرة ناشفة مطحونة ناعم للطشة' },
      { id: 'i7', text: 'ليمونة معصفرة مقطعة مكعبات صغننة + عصير ليمونة فريش' },
      { id: 'i8', text: 'ملح خشن، فلفل أسود مجروش، ورشة جوزة الطيب' },
    ],
    steps: [
      { id: 's1', title: 'تشويح اللحمة مع السمنة', body: 'في حلة سخنة، انزلي بمعلقة سمنة وشوحي قطع اللحمة الضاني تاخد لون دهبي ريحتها تطلع مع فصين حبهان مستكة.' },
      { id: 's2', title: 'تسبيكة الصلصة ورمي البامية', body: 'ضيفي عصير الطماطم وسيبيه يتسبك على نار هادية ١٥ دقيقة، بعدين انزلي بالبامية وكبشتين من شوربة الضاني السخنة.' },
      { id: 's3', title: 'طشة التوم والكزبرة', body: 'في طاسة صغيرة، شوحي التوم المفروم مع الكزبرة الناشفة في السمنة البلدي، وأول ما يصفر طشيه على البامية وقلبي برقة.' },
      { id: 's4', title: 'تجهيز الطاجن والليمون المعصفر', body: 'سخني طاجن الفخار في الفرن الأول، صبي فيه البامية واللحمة، وزعي قطع الليمون المعصفر وقرن الشطة فوق الوش.' },
      { id: 's5', title: 'دخول الفرن والتحمير', body: 'دخلي الطاجن فرن ساخن على ٢٠٠ درجة مئوية لمدة ٢٥ دقيقة، وشغلي الشواية دقيقتين عشان ياخد وش أحمر مقرمش وريحة تجيب لآخر الشارع!' },
    ],
    tips: [
      { id: 't1', title: 'بلاش تقليب كتير في البامية!', body: 'البامية رقيقة وحساسة، هزي الحلة أو الطاجن بإيدك بدل المغرفة عشان متتهريش وتطلع معاكي الحبة بحبتها وشكلها يفتح النفس.' },
      { id: 't2', title: 'تسخين الطاجن الفخار سر التسوية', body: 'حطي الطاجن الفاضي جوة الفرن وهو بيسخن ١٠ دقايق قبل ما تنزلي بالأكل، الحركة دي بتحبس النكهة وتخلي الصلصة تبكبك فوراً.' },
    ],
  },
};

export const getRecipeDetail = (id: string): RecipeDetail | undefined => {
  const base = placeholders.find((p) => p.id === id);
  if (!base) return undefined;
  const extra = fullDetails[id];
  if (extra) {
    return { ...base, ...extra } as RecipeDetail;
  }
  return {
    ...base,
    ingredients: [
      { id: 'i1', text: 'مكونات أساسية متوفرة في أي مطبخ' },
      { id: 'i2', text: 'بصلة متوسطة مفرومة ناعم' },
      { id: 'i3', text: '٢ طماطم مبشورة' },
      { id: 'i4', text: 'فصين توم + ملعقة سمنة بلدي' },
      { id: 'i5', text: 'ملح وفلفل أسود وكمون' },
    ],
    steps: [
      { id: 's1', title: 'تجهيز المكون الأساسي', body: 'اغسلي المكونات كويس وصفيها من المية، وجهزي البولة والتوم قبل ما تبدأي.' },
      { id: 's2', title: 'التشويح', body: 'في طاسة سخنة، شوحي المكونات الأولية في السمنة لحد ما تاخد لون ذهبي وريحة تطلع.' },
      { id: 's3', title: 'إضافة البهارات', body: 'ضيفي البهارات على البولة وقلبي كويس، وسيبيها تتسبك شوية عشان النكهة تتركز.' },
      { id: 's4', title: 'التسوية النهائية', body: 'غطي الحلة وسيبيها على نار هادية لحد ما كل المكونات تستوي تماماً وتتجانس مع بعض.' },
    ],
    tips: [
      { id: 't1', title: 'نصيحة ست الكل', body: 'متستعجليش النار، النار الهادية بتطلع أحلى نكهة وبتحافظ على القوام.' },
    ],
  };
};
