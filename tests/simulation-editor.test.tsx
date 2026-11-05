import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { it, expect, vi } from "vitest";
import MatiereCard from "../components/ui/notes/MatiereCard";
vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  StyleSheet: { create: (s: unknown) => s },
}));
vi.mock("@react-native-community/slider", () => ({ default: "Slider" }));
vi.mock("../components/ui/Primitives", () => ({
  Badge: "Badge",
  Button: "Button",
  ui: { row: {}, small: {}, wrap: {} },
}));
it("stages slider changes locally and commits a precise comma value only on Apply", async () => {
  const update = vi.fn();
  let renderer: ReactTestRenderer;
  await act(async () => {
    renderer = create(
      <MatiereCard
        evaluationData={[
          {
            name: "Fictif",
            code: "a",
            coeff: 1,
            uniqueId: "a",
            noteReelle: null,
            source: "missing",
          },
        ]}
        simulatedNotes={{}}
        updateSimulation={update}
      />,
    );
  });
  await act(async () =>
    renderer!.root.findByProps({ label: "Simuler" }).props.onPress(),
  );
  await act(async () => {
    const slider = renderer!.root.findByType("Slider" as React.ElementType);
    for (let i = 0; i < 100; i++) slider.props.onValueChange(i / 10);
  });
  expect(update).not.toHaveBeenCalled();
  await act(async () =>
    renderer!.root
      .findByType("TextInput" as React.ElementType)
      .props.onChangeText("12,75"),
  );
  await act(async () =>
    renderer!.root.findByProps({ label: "Appliquer" }).props.onPress(),
  );
  expect(update).toHaveBeenCalledExactlyOnceWith("a", 12.75);
  await act(async () => renderer!.unmount());
});
