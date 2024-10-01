import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import * as React from "react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

const cache = createCache({
  key: "cache-ltr",
  stylisPlugins: [prefixer],
});

const cacheRtl = createCache({
  key: "cache-rtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

export default function DirWrapper({
  children,
  isRtl,
}: React.PropsWithChildren<{ isRtl: boolean }>) {
  return (
    <CacheProvider value={isRtl ? cacheRtl : cache}>
      <div dir={isRtl ? "rtl" : "ltr"}>{children}</div>
    </CacheProvider>
  );
}
