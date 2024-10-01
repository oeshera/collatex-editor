import type {} from "@redux-devtools/extension";
import { enqueueSnackbar } from "notistack";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { JSONToFile } from "./utils";

export enum Dir {
  RTL = "rtl",
  LTR = "ltr",
}

const tokenSchema = z.intersection(
  z.object({
    t: z.string(),
    n: z.string().optional(),
  }),
  z.record(z.string(), z.string().or(z.number()))
);

const cellSchema = z.array(tokenSchema);

const columnSchema = z.array(cellSchema);

const rowSchema = z.intersection(
  z.object({
    witness: z.string(),
  }),
  z.record(z.number(), cellSchema)
);

export const tableSchema = z.object({
  witnesses: z.array(z.string()),
  table: z.array(columnSchema),
});

export const collationSchema = z.object({
  id: z.string().uuid().default(uuidv4()),
  name: z.string().default(""),
  dir: z.nativeEnum(Dir).default(Dir.LTR),
  alignmentTable: tableSchema.nullable(),
});

export type Token = z.infer<typeof tokenSchema>;

export type Cell = z.infer<typeof cellSchema>;

export type Column = z.infer<typeof columnSchema>;

export type Row = z.infer<typeof rowSchema>;

export type Table = z.infer<typeof tableSchema>;

export type Collation = z.infer<typeof collationSchema>;

interface DataState {
  collations: Collation[];
  importCollation: (data: Collation) => void;
  updateCollation: (data: Collation) => void;
  deleteCollation: (id: string) => void;
  exportCollation: (id: string) => void;
}

export const useDataStore = create<DataState>()(
  devtools(
    persist(
      (set, get) => ({
        collations: [],
        importCollation: (data) => {
          set((state) => ({
            collations: state.collations.some((o) => o.id === data.id)
              ? state.collations.map((o) => (o.id === data.id ? data : o))
              : [...state.collations, data],
          }));
        },
        updateCollation: (data) =>
          set((state) => ({
            collations: state.collations.map((o) =>
              o.id === data.id ? data : o
            ),
          })),
        deleteCollation: (id) =>
          set((state) => ({
            collations: state.collations.filter((o) => o.id !== id),
          })),
        exportCollation: (id) => {
          const collation = get().collations.find((c) => c.id === id);
          if (!collation?.alignmentTable) {
            return enqueueSnackbar("Export Failed", { variant: "error" });
          }
          JSONToFile({
            obj: collation.alignmentTable,
            filename: collation.name,
          });
          enqueueSnackbar("Success", { variant: "success" });
        },
      }),
      { name: "collatex-editor-data" }
    )
  )
);
