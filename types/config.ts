export interface CurriculumCatalog {
  annee: Record<string, Record<string, Record<string, string>>>;
}
/** Keep existing saved selections readable after the product label changed. */
export const normalizeYear = (year: string) => (year === "M1" ? "ISEN4" : year);

/** Old mobile caches/GitHub catalogs must not hide newly bundled curricula. */
export function mergeCatalog(
  source: CurriculumCatalog,
  bundled: CurriculumCatalog,
): CurriculumCatalog {
  const { M1, ...years } = source.annee;
  return {
    annee: {
      ...bundled.annee,
      ...years,
      ...(!years.ISEN4 && M1 ? { ISEN4: M1 } : {}),
    },
  };
}
export function validCatalog(value: unknown): value is CurriculumCatalog {
  if (
    !value ||
    typeof value !== "object" ||
    !("annee" in value) ||
    !value.annee ||
    typeof value.annee !== "object"
  )
    return false;
  return Object.values(value.annee).every(
    (year) =>
      year &&
      typeof year === "object" &&
      Object.values(year).every(
        (semester) =>
          semester &&
          typeof semester === "object" &&
          Object.values(semester).every(
            (url) =>
              typeof url === "string" &&
              url.startsWith(
                "https://raw.githubusercontent.com/Tony83400/CalculNotesIsen/",
              ),
          ),
      ),
  );
}
