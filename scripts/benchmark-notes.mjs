import { performance } from "node:perf_hooks";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import ts from "typescript";
mkdirSync(".bench", { recursive: true });
const fixture = JSON.parse(
  readFileSync("structures_notes/annee_4/S7_DEV_LOGICIEL.json", "utf8"),
);
const notes = fixture.flatMap((u) =>
  u.matieres.flatMap((m) =>
    m.evaluations
      .filter((e) => e.code)
      .map((e) => ({
        code: e.code,
        name: e.name,
        note: 12,
        date: "01/11/2026",
      })),
  ),
);
for (let i = 0; i < 250; i++)
  notes.push({ code: `OTHER_S8_${i}`, name: "Fictif", note: 12, date: "" });
const results = {};
for (const [name, path] of [
  ["before", "tests/notes.before.ts"],
  ["after", "utils/notes.ts"],
]) {
  writeFileSync(
    `.bench/${name}.mjs`,
    ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  );
  const { default: calc } = await import(`../.bench/${name}.mjs?${Date.now()}`);
  for (let i = 0; i < 300; i++) calc(fixture, notes, {});
  const times = [];
  for (let i = 0; i < 2000; i++) {
    const t = performance.now();
    calc(fixture, notes, {});
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  results[name] = {
    medianMs: times[1000],
    p95Ms: times[1900],
    iterations: times.length,
    evaluations: fixture.flatMap((u) =>
      u.matieres.flatMap((m) => m.evaluations),
    ).length,
    apiNotes: notes.length,
  };
}
console.log(JSON.stringify({ node: process.version, results }, null, 2));
