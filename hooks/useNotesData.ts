import { useAppData } from "../providers/AppData";
export const useNotesData = () => {
  const a = useAppData();
  return {
    notes: a.notes.data,
    lastUpdate: a.notes.updatedAt,
    selectedSemester: a.semester,
    selectedMajors: a.majors,
    allConfigs: Object.fromEntries(
      Object.entries(a.configs).map(([s, c]) => [
        s,
        { filieres: { [a.majors[s]]: c } },
      ]),
    ),
    userId: a.user,
    error: a.notes.error,
    isLoading: !a.ready,
    isRefreshing: a.notes.status === "loading",
    handleSemesterChange: a.selectSemester,
    fetchNotes: a.refresh,
  };
};
