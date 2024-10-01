import { Delete, Download, Edit, Upload } from "@mui/icons-material";
import {
  Box,
  Button,
  DialogContent,
  DialogTitle,
  IconButton,
  lighten,
  Link,
  Tooltip,
} from "@mui/material";
import { Link as RouterLink } from "@tanstack/react-router";
import {
  MaterialReactTable,
  MRT_GlobalFilterTextField,
  MRT_ToggleFiltersButton,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
} from "material-react-table";
import * as React from "react";
import { Collation, useDataStore } from "../store";
import CollationForm from "./CollationForm";

const Cell = ({
  renderedCellValue,
  row,
}: {
  renderedCellValue: React.ReactNode;
  row: MRT_Row<Collation>;
}) => (
  <Link component={RouterLink} to={row.id}>
    {renderedCellValue}
  </Link>
);

const columns: MRT_ColumnDef<Collation>[] = [
  {
    accessorKey: "name",
    header: "Collation Name",
    Cell,
  },
  {
    accessorFn: (row: Collation) => row.alignmentTable?.witnesses.length,
    header: "Witnesses",
    Cell,
  },
  {
    accessorFn: (row: Collation) => row.alignmentTable?.table.length,
    header: "Columns",
    Cell,
  },
];

export default function CollationsList() {
  const data = useDataStore((state) => state.collations);
  const deleteCollation = useDataStore((state) => state.deleteCollation);
  const exportCollation = useDataStore((state) => state.exportCollation);

  const table = useMaterialReactTable({
    columns,
    data,
    createDisplayMode: "modal",
    editDisplayMode: "modal",
    getRowId: (row) => row.id,
    enableEditing: true,
    enableColumnFilterModes: true,
    enableRowSelection: true,
    enableBatchRowSelection: true,
    paginationDisplayMode: "pages",
    positionToolbarAlertBanner: "bottom",
    positionActionsColumn: "last",
    muiPaginationProps: {
      color: "secondary",
      shape: "rounded",
      variant: "outlined",
    },
    muiTableContainerProps: {
      sx: {
        minHeight: "500px",
        maxHeight: "calc(100vh - 225px)",
      },
    },
    muiCreateRowModalProps: { fullWidth: true, maxWidth: "sm" } as any,
    muiEditRowDialogProps: { fullWidth: true, maxWidth: "sm" } as any,
    renderCreateRowDialogContent: ({ table }) => (
      <React.Fragment>
        <DialogTitle variant="h5">Import Collation</DialogTitle>
        <DialogContent>
          <CollationForm closeDialog={() => table.setCreatingRow(null)} />
        </DialogContent>
      </React.Fragment>
    ),
    renderEditRowDialogContent: ({ table, row }) => (
      <React.Fragment>
        <DialogTitle variant="h5">Edit Collation</DialogTitle>
        <DialogContent>
          <CollationForm
            collation={row.original}
            closeDialog={() => table.setEditingRow(null)}
          />
        </DialogContent>
      </React.Fragment>
    ),
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: "flex", gap: "1rem" }}>
        <Tooltip title="Edit">
          <IconButton onClick={() => table.setEditingRow(row)}>
            <Edit />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            color="secondary"
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this record?")
              ) {
                deleteCollation(row.original.id);
              }
            }}
          >
            <Delete />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    renderTopToolbar: ({ table }) => {
      return (
        <Box
          sx={(theme) => ({
            backgroundColor: lighten(theme.palette.background.default, 0.05),
            display: "flex",
            gap: "0.5rem",
            p: "8px",
            justifyContent: "space-between",
          })}
        >
          <Box sx={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <MRT_GlobalFilterTextField table={table} />
            <MRT_ToggleFiltersButton table={table} />
          </Box>
          <Box>
            <Box sx={{ display: "flex", gap: "0.5rem" }}>
              <Button
                color="secondary"
                size="small"
                disabled={table.getSelectedRowModel().rows.length === 0}
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete the selected records?"
                    )
                  ) {
                    table.getSelectedRowModel().flatRows.map((row) => {
                      deleteCollation(row.id);
                    });
                    table.resetRowSelection(true);
                  }
                }}
                variant="contained"
                startIcon={<Delete />}
              >
                Delete
              </Button>
              <Button
                color="primary"
                size="small"
                disabled={table.getSelectedRowModel().rows.length === 0}
                onClick={() => {
                  table.getSelectedRowModel().flatRows.map((row) => {
                    exportCollation(row.id);
                  });
                }}
                variant="contained"
                startIcon={<Download />}
              >
                Export
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => table.setCreatingRow(true)}
                startIcon={<Upload />}
              >
                Import
              </Button>
            </Box>
          </Box>
        </Box>
      );
    },
  });

  return <MaterialReactTable table={table} />;
}
