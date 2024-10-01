import { createTheme, ThemeProvider as MUIThemeProvider } from "@mui/material";
import type {} from "@redux-devtools/extension";
import * as React from "react";
import { createContext, useContext } from "react";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export enum Theme {
  DARK = "dark",
  LIGHT = "light",
  DEVICE = "device",
}

interface Props {
  children: React.ReactNode;
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        theme: Theme.DEVICE,
        setTheme: (theme) => set({ theme }),
      }),
      {
        name: "collatex-editor-theme",
      }
    )
  )
);

const ThemeContext = createContext<ThemeState>({
  theme: Theme.DARK,
  setTheme: () => undefined,
});

export const ThemeProvider: React.FC<Props> = ({ children }) => {
  const theme = useThemeStore((state) => state.theme);
  const browserDefault = window.matchMedia("(prefers-color-scheme: dark)")
    .matches
    ? Theme.DARK
    : Theme.LIGHT;
  const getTheme = () => (theme === Theme.DEVICE ? browserDefault : theme);

  return (
    <MUIThemeProvider
      theme={getTheme() === Theme.LIGHT ? lightTheme : darkTheme}
    >
      {children}
    </MUIThemeProvider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    // background: { default: "#070303" },
    primary: { main: "#cbf6d7" },
    secondary: { main: "#344b4a" },
    // divider: "#2d808b",
    // text: { primary: "#f8e8e9" },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    // background: { default: "#fcf8f8" },
    primary: { main: "#093415" },
    secondary: { main: "#95aeb5" },
    // divider: "#74c7d2",
    // text: { primary: "#170708" },
  },
});
