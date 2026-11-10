import { Colors as C } from "../constants/Colors";
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={C.primary} />
        <title>CalculNotesISEN · Le carnet de campus</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `:focus-visible{outline:3px solid ${C.status.info}!important;outline-offset:3px}html,body,#root{height:100%;background:${C.background}}html,body{overflow-x:hidden;max-width:100%}body{margin:0}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
