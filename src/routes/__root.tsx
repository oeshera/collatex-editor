import { Box, CssBaseline } from "@mui/material";
import {
  createRootRoute,
  Outlet,
  ScrollRestoration,
} from "@tanstack/react-router";
import { SnackbarProvider } from "notistack";
import * as React from "react";
import Footer from "../components/Footer";
import { ThemeProvider } from "../theme";

const TanStackRouterDevtools =
  import.meta.env.VITE_NODE_ENV === "prod"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        }))
      );

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider>
      <SnackbarProvider>
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
          }}
        >
          <Box sx={{ width: "100%", height: "100%", flex: 1, p: 3 }}>
            <Outlet />
          </Box>
          <Footer />
        </Box>
        <ScrollRestoration />
      </SnackbarProvider>
      <React.Suspense>
        <TanStackRouterDevtools />
      </React.Suspense>
    </ThemeProvider>
  );
}
