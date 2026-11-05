export interface CurriculumCatalog {
  annee: Record<string, Record<string, Record<string, string>>>;
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
