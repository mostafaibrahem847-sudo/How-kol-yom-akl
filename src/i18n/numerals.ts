const east = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export const toArabicNumerals = (n: number | string): string => {
  return String(n).replace(/[0-9]/g, (d) => east[Number(d)]);
};

export const toWesternNumerals = (n: number | string): string => {
  return String(n).replace(/[٠-٩]/g, (d) => String(east.indexOf(d)));
};

export const minutesLabel = (n: number): string => `${toArabicNumerals(n)} دقيقة`;
export const minutesLabelWestern = (n: number): string => `${n} دقيقة`;
