const east = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export const toArabicNumerals = (n: number | string): string => {
  return String(n).replace(/[0-9]/g, (d) => east[Number(d)]);
};
