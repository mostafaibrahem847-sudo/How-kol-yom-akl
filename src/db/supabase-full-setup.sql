-- COMPLETE DATABASE SETUP — Schema + All 10 Recipes
-- Run this in Supabase SQL Editor (https://lawoormzqfeyafjrptqc.supabase.co/project/default/sql/new)

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  minutes INTEGER,
  persons INTEGER,
  difficulty TEXT,
  rating NUMERIC,
  audio_available BOOLEAN DEFAULT FALSE,
  occasion TEXT,
  category_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_hint TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audio_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes USING gin(to_tsvector('arabic', title));
CREATE INDEX IF NOT EXISTS idx_recipes_description ON recipes USING gin(to_tsvector('arabic', description));
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);

-- INSERT RECIPES (10)
INSERT INTO recipes (id, title, subtitle, description, category, minutes, persons, difficulty, rating, audio_available, occasion, category_color)
VALUES
('okra', 'طاجن بامية باللحمة الضاني', 'مع الرز بالشعرية المفلفل والليمون المعصفر', 'بالطشة البلدي والليمون المعصفر، ريحة تجيب آخر الشارع', 'طواجن أصيلة', 45, 5, 'متوسطة', 4.9, true, 'محبوبة العيلة', 'olive'),
('molokhia', 'ملوخية خضرا بالطشة مع فراخ محمرة', NULL, 'سر عِرق الملوخية المظبوط وطشة التوم بالكزبرة الناشفة اللي تجيب لآخر الشارع، مع فراخ مسلوقة ومتحمرة في السمنة البلدي.', 'أكلة الأسبوع', 35, 4, 'سهلة', NULL, true, NULL, 'olive'),
('kofta', 'كفتة الحاتي المشوية وسلطة طحينة', NULL, 'متبلة بتفل البصل وبهارات الحاتي، مشوية في فرن البوتاجاز مع فحمة تديكي ريحة وطراوة الجاهز بالظبط.', 'مشويات وسريعة', 25, 4, 'سريعة', NULL, false, NULL, 'olive'),
('bechamel', 'صينية مكرونة بالبشاميل المظبوطة', NULL, 'طبقات بشاميل كريمي سايح بدون تكتل، مع عصاج لحمة مفرومة بطماطم خفيفة وقشرة دهبية تفتح النفس.', 'عزومات ولمة', 50, 6, 'متوسطة', NULL, false, NULL, 'olive'),
('oxtail', 'طاجن عكاوي بالبصل القاورما', NULL, 'لحمة دايبة دوب وريحة هتقلب البيت كله بطريقة ست الكل.', 'مناسب للعزومات', 60, 4, NULL, NULL, true, 'مناسب للعزومات', 'olive'),
('koshary', 'كشري مصري بيتي بالصلصة والدقة والتقلية', NULL, 'سر دقة المحلات والتقلية المقرمشة اللي بتفرقع من الجمال.', 'أكلة التوفير', 40, 6, NULL, NULL, true, 'أكلة التوفير', 'amber'),
('potatoChicken', 'صينية بطاطس بالفراخ ورز معمر', NULL, 'صينية الإنقاذ السريعة مع رز فلاحي بريحة السمنة البلدي.', 'سريعة وسهلة', 45, 5, NULL, NULL, true, 'سريعة وسهلة', 'mint'),
('omAli', 'أم علي بالمكسرات والقشطة البلدي', NULL, 'وش مقرمش مكرمل وجواها طري غرقان باللبن والمكسرات.', 'حلو وسريع', 20, 4, NULL, NULL, false, 'حلو وسريع', 'terracottaLight'),
('chickenPotato', 'صينية بطاطس بالفراخ المحمرة', NULL, 'البطاطس دايبة ومتبلة مع فراخ مقرمشة محمرة على أصولها.', 'غدا عائلي سريع', 40, 5, NULL, 4.8, true, NULL, 'olive'),
('hawawshi', 'حواوشي إسكندراني بالعجين', NULL, 'عجينة قطنية وهشة بحشوة اللحمة المتبلة مع رشة حبة البركة.', 'معجنات وحرشة', 30, 4, NULL, 5.0, false, NULL, 'olive');

-- OKRA FULL DETAILS (ingredients / steps / tips / audio)
INSERT INTO ingredients (recipe_id, text) VALUES
('okra', '١ كيلو بامية بلدي مقمعة طازة صغننة'),
('okra', 'نصف كيلو لحمة ضاني مسلوقة نص سلقة مع الشوربة'),
('okra', '٤ أكواب عصير طماطم فريش متسبكة تقيلة'),
('okra', 'رأس توم بلدي مفروم مع قرن فلفل حامي أحمر'),
('okra', '٢ ملعقة كبيرة سمنة بلدي بقري فلاحي'),
('okra', 'ملعقة كزبرة ناشفة مطحونة ناعم للطشة'),
('okra', 'ليمونة معصفرة مقطعة مكعبات صغننة + عصير ليمونة فريش'),
('okra', 'ملح خشن، فلفل أسود مجروش، ورشة جوزة الطيب');

INSERT INTO steps (recipe_id, title, body, sort_order) VALUES
('okra', 'تشويح اللحمة مع السمنة', 'في حلة سخنة، انزلي بمعلقة سمنة وشوحي قطع اللحمة الضاني تاخد لون دهبي ريحتها تطلع مع فصين حبهان مستكة.', 1),
('okra', 'تسبيكة الصلصة ورمي البامية', 'ضيفي عصير الطماطم وسيبيه يتسبك على نار هادية ١٥ دقيقة، بعدين انزلي بالبامية وكبشتين من شوربة الضاني السخنة.', 2),
('okra', 'طشة التوم والكزبرة', 'في طاسة صغيرة، شوحي التوم المفروم مع الكزبرة الناشفة في السمنة البلدي، وأول ما يصفر طشيه على البامية وقلبي برقة.', 3),
('okra', 'تجهيز الطاجن والليمون المعصفر', 'سخني طاجن الفخار في الفرن الأول، صبي فيه البامية واللحمة، وزعي قطع الليمون المعصفر وقرن الشطة فوق الوش.', 4),
('okra', 'دخول الفرن والتحمير', 'دخلي الطاجن فرن ساخن على ٢٠٠ درجة مئوية لمدة ٢٥ دقيقة، وشغلي الشواية دقيقتين عشان ياخد وش أحمر مقرمش وريحة تجيب لآخر الشارع!', 5);

INSERT INTO tips (recipe_id, title, body) VALUES
('okra', 'بلاش تقليب كتير في البامية!', 'البامية رقيقة وحساسة، هزي الحلة أو الطاجن بإيدك بدل المغرفة عشان متتهريش وتطلع معاكي الحبة بحبتها وشكلها يفتح النفس.'),
('okra', 'تسخين الطاجن الفخار سر التسوية', 'حطي الطاجن الفاضي جوة الفرن وهو بيسخن ١٠ دقايق قبل ما تنزلي بالأكل، الحركة دي بتحبس النكهة وتخلي الصلصة تبكبك فوراً.');

INSERT INTO audio_urls (recipe_id, url) VALUES
('okra', 'https://example.com/audio/okra.mp3'),
('molokhia', 'https://example.com/audio/molokhia.mp3'),
('oxtail', 'https://example.com/audio/oxtail.mp3'),
('koshary', 'https://example.com/audio/koshary.mp3'),
('potatoChicken', 'https://example.com/audio/potatoChicken.mp3'),
('chickenPotato', 'https://example.com/audio/chickenPotato.mp3');
