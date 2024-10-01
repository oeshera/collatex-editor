/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'

// Create Virtual Routes

const FaqLazyImport = createFileRoute('/faq')()
const DocLazyImport = createFileRoute('/doc')()
const IdLazyImport = createFileRoute('/$id')()
const IndexLazyImport = createFileRoute('/')()

// Create/Update Routes

const FaqLazyRoute = FaqLazyImport.update({
  path: '/faq',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/faq.lazy').then((d) => d.Route))

const DocLazyRoute = DocLazyImport.update({
  path: '/doc',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/doc.lazy').then((d) => d.Route))

const IdLazyRoute = IdLazyImport.update({
  path: '/$id',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/$id.lazy').then((d) => d.Route))

const IndexLazyRoute = IndexLazyImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$id': {
      id: '/$id'
      path: '/$id'
      fullPath: '/$id'
      preLoaderRoute: typeof IdLazyImport
      parentRoute: typeof rootRoute
    }
    '/doc': {
      id: '/doc'
      path: '/doc'
      fullPath: '/doc'
      preLoaderRoute: typeof DocLazyImport
      parentRoute: typeof rootRoute
    }
    '/faq': {
      id: '/faq'
      path: '/faq'
      fullPath: '/faq'
      preLoaderRoute: typeof FaqLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexLazyRoute
  '/$id': typeof IdLazyRoute
  '/doc': typeof DocLazyRoute
  '/faq': typeof FaqLazyRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexLazyRoute
  '/$id': typeof IdLazyRoute
  '/doc': typeof DocLazyRoute
  '/faq': typeof FaqLazyRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexLazyRoute
  '/$id': typeof IdLazyRoute
  '/doc': typeof DocLazyRoute
  '/faq': typeof FaqLazyRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/$id' | '/doc' | '/faq'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/$id' | '/doc' | '/faq'
  id: '__root__' | '/' | '/$id' | '/doc' | '/faq'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexLazyRoute: typeof IndexLazyRoute
  IdLazyRoute: typeof IdLazyRoute
  DocLazyRoute: typeof DocLazyRoute
  FaqLazyRoute: typeof FaqLazyRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexLazyRoute: IndexLazyRoute,
  IdLazyRoute: IdLazyRoute,
  DocLazyRoute: DocLazyRoute,
  FaqLazyRoute: FaqLazyRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/$id",
        "/doc",
        "/faq"
      ]
    },
    "/": {
      "filePath": "index.lazy.tsx"
    },
    "/$id": {
      "filePath": "$id.lazy.tsx"
    },
    "/doc": {
      "filePath": "doc.lazy.tsx"
    },
    "/faq": {
      "filePath": "faq.lazy.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
