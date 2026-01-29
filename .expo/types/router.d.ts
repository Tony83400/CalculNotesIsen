/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/agenda`; params?: Router.UnknownInputParams; } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/notes`; params?: Router.UnknownInputParams; } | { pathname: `/selection`; params?: Router.UnknownInputParams; } | { pathname: `/../components/ui/notes/RefreshButton`; params?: Router.UnknownInputParams; } | { pathname: `/../services/configApi`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/agenda`; params?: Router.UnknownOutputParams; } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/notes`; params?: Router.UnknownOutputParams; } | { pathname: `/selection`; params?: Router.UnknownOutputParams; } | { pathname: `/../components/ui/notes/RefreshButton`; params?: Router.UnknownOutputParams; } | { pathname: `/../services/configApi`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/agenda${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `/notes${`?${string}` | `#${string}` | ''}` | `/selection${`?${string}` | `#${string}` | ''}` | `/../components/ui/notes/RefreshButton${`?${string}` | `#${string}` | ''}` | `/../services/configApi${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/agenda`; params?: Router.UnknownInputParams; } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/notes`; params?: Router.UnknownInputParams; } | { pathname: `/selection`; params?: Router.UnknownInputParams; } | { pathname: `/../components/ui/notes/RefreshButton`; params?: Router.UnknownInputParams; } | { pathname: `/../services/configApi`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; };
    }
  }
}
