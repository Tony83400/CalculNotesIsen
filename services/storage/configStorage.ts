import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  storageKeys,
} from "./base";

const structureName = "StructureConfig";
const selectedYearName = "SelectedYear";
const selectedSemesterName = "SelectedSemester";
const selectedMajorsName = "SelectedMajors";
const selectedMajorsUrlsName = "SelectedMajorsUrls";

export async function getSelectedYear(): Promise<string | null> {
  return await getStorageItem(selectedYearName);
}

export async function setSelectedYear(value: string) {
  await setStorageItem(selectedYearName, value);
}

export async function getSelectedSemester(): Promise<string | null> {
  return await getStorageItem(selectedSemesterName);
}

export async function setSelectedSemester(value: string) {
  await setStorageItem(selectedSemesterName, value);
}

export async function getSelectedMajors(): Promise<Record<
  string,
  string
> | null> {
  const data = await getStorageItem(selectedMajorsName);
  if (!data || data === "undefined") return null;
  try {
    const parsed: unknown = JSON.parse(data);
    return parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      Object.values(parsed).every((v) => typeof v === "string")
      ? (parsed as Record<string, string>)
      : null;
  } catch {
    return null;
  }
}

export async function setSelectedMajors(value: Record<string, string>) {
  await setStorageItem(selectedMajorsName, JSON.stringify(value));
}

export async function getSelectedMajorsUrls(): Promise<Record<
  string,
  string
> | null> {
  const data = await getStorageItem(selectedMajorsUrlsName);
  if (!data || data === "undefined") return null;
  try {
    const parsed: unknown = JSON.parse(data);
    return parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      Object.values(parsed).every((v) => typeof v === "string")
      ? (parsed as Record<string, string>)
      : null;
  } catch {
    return null;
  }
}

export async function setSelectedMajorsUrls(value: Record<string, string>) {
  await setStorageItem(selectedMajorsUrlsName, JSON.stringify(value));
}

export async function clearStructureCache() {
  const keys = await storageKeys();
  await Promise.all(
    keys.filter((k) => k.startsWith(structureName)).map(removeStorageItem),
  );
}

export async function saveStructureToCache(structure: unknown) {
  try {
    await setStorageItem(structureName, JSON.stringify(structure));
  } catch {
    // A full cache must not prevent using the downloaded structure.
  }
}

export async function loadStructureFromCache(): Promise<unknown | null> {
  const cachedString = await getStorageItem(structureName);
  if (cachedString) {
    try {
      return JSON.parse(cachedString);
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveSemesterStructureToCache(
  semester: string,
  url: string,
  structure: unknown,
) {
  try {
    const urlId = url.split("/").pop()?.replace(".json", "") || "unknown";
    await setStorageItem(
      `${structureName}_${semester}_${urlId}`,
      JSON.stringify(structure),
    );
  } catch {
    // Network data remains usable without a persistent cache.
  }
}

export async function loadSemesterStructureFromCache(
  semester: string,
  url: string,
): Promise<unknown | null> {
  try {
    const urlId = url.split("/").pop()?.replace(".json", "") || "unknown";
    const cachedString = await getStorageItem(
      `${structureName}_${semester}_${urlId}`,
    );
    if (cachedString) {
      return JSON.parse(cachedString);
    }
  } catch {
    return null;
  }
  return null;
}
