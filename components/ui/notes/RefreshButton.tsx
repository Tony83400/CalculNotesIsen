import React from "react";
import { Button } from "../Primitives";
import { useAppData } from "../../../providers/AppData";
export default function RefreshButton() {
  const app = useAppData();
  return (
    <Button
      label="Actualiser les données"
      loading={
        app.notes.status === "loading" || app.agenda.status === "loading"
      }
      onPress={() => void app.refresh()}
    />
  );
}
