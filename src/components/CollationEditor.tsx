import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  ArrowBack,
  ArrowForward,
  Delete,
  DeleteForever,
  Download,
  Edit,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Breadcrumbs,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  Link,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Navigate,
  Link as RouterLink,
  useNavigate,
} from "@tanstack/react-router";
import { githubDarkTheme, githubLightTheme, JsonEditor } from "json-edit-react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_Column,
  type MRT_ColumnDef,
  type MRT_ColumnSizingState,
  type MRT_ColumnVirtualizer,
  type MRT_RowVirtualizer,
} from "material-react-table";
import { useConfirm } from "material-ui-confirm";
import {
  bindContextMenu,
  bindDialog,
  bindMenu,
  bindTrigger,
  usePopupState,
} from "material-ui-popup-state/hooks";
import { enqueueSnackbar } from "notistack";
import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Cell,
  Collation,
  Dir,
  Row,
  Table,
  Token,
  useDataStore,
} from "../store";
import { getTextWidth, isNumeric } from "../utils";
import DirWrapper from "./DirWrapper";

const getReactTableData = (alignmentTable: Table): Row[] => {
  const { table: tableColumns, witnesses: tableRows } = alignmentTable;
  const data = tableRows.map((siglum, rowIndex) => {
    let d: Row = { witness: siglum };
    let tokenOrder = -1;
    tableColumns.forEach(
      (column, colIndex) =>
        (d[colIndex] = column[rowIndex].map((t, i) => ({
          ...t,
          collatexEditorTokenOrder: tokenOrder++,
          collatexEditorTokenRow: rowIndex,
          collatexEditorTokenCol: colIndex,
          collatexEditorTokenId: t.collatexEditorTokenId || uuidv4(),
        })))
    );
    return d;
  });
  return data;
};

const getAlignmentTable = (data: Row[]): Table => {
  const numCols = Math.max(...data.map((row) => Object.keys(row).length - 1));
  const table = [...Array(numCols)].map((_, i) =>
    data.map((row) => row[i] || [])
  );
  const witnesses = data.map((row) => row.witness);
  return { witnesses, table };
};

function TableToken({ token }: { token: Token }) {
  return (
    <Box
      sx={{
        p: 1,
        fontSize: "1.5em",
        borderStyle: "solid",
        borderWidth: 1,
        borderRadius: 2,
        borderColor: (theme) => theme.palette.divider,
      }}
    >
      {token.n || token.t}
    </Box>
  );
}

function DraggingToken({ token }: { token: Token }) {
  return (
    <Box
      sx={{
        p: 1,
        fontSize: "1.25em",
        borderStyle: "solid",
        borderWidth: 1,
        borderRadius: 2,
        borderColor: (theme) => theme.palette.divider,
        backgroundColor: (theme) => theme.palette.secondary.main,
        color: (theme) => theme.palette.secondary.contrastText,
      }}
    >
      {token.n || token.t}
    </Box>
  );
}

function DraggableToken(
  props: React.PropsWithChildren<
    {
      id: string;
      data: Token;
      onDelete: (token: Token) => void;
      onUpdate: (originalToken: Token, updatedToken: Token) => void;
      onInsertTokens: (
        token: Token,
        direction: "left" | "right",
        newTokens: Token[]
      ) => void;
      isRtl: boolean;
    } & React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLDivElement>,
      HTMLDivElement
    >
  >
) {
  const {
    id,
    children,
    data,
    onDelete,
    onUpdate,
    onInsertTokens,
    isRtl,
    ...other
  } = props;

  const { attributes, listeners, setNodeRef } = useDraggable({
    id,
    data,
  });

  const theme = useTheme();
  const confirm = useConfirm();

  const contextMenuState = usePopupState({
    variant: "popover",
    popupId: "tokenContextMenu",
  });

  const editDialogState = usePopupState({
    variant: "dialog",
    popupId: "tokenEditDialog",
  });

  const insertTokenDialogState = usePopupState({
    variant: "dialog",
    popupId: "insertTokenDialog",
  });

  const [editedToken, setEditedToken] = React.useState<Token>(data);
  const [insertDirection, setInsertDirection] = React.useState<
    "left" | "right"
  >("right");
  const [tokenText, setTokenText] = React.useState("");

  React.useEffect(() => {
    if (editDialogState.isOpen) {
      setEditedToken(data);
    }
  }, [editDialogState.isOpen, data]);

  const handleInsertTokens = () => {
    if (tokenText.trim().length === 0) {
      enqueueSnackbar("Token text cannot be empty", { variant: "error" });
      return;
    }

    const tokens = tokenText
      .trim()
      .split(/\s+/)
      .map((t) => ({
        t: t,
        collatexEditorTokenRow: data.collatexEditorTokenRow,
        collatexEditorTokenCol: data.collatexEditorTokenCol,
        collatexEditorTokenId: uuidv4(),
      }));

    onInsertTokens(data, insertDirection, tokens);
    insertTokenDialogState.close();
    setTokenText("");
  };

  return (
    <>
      <div {...bindContextMenu(contextMenuState)}>
        <span
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          {...other}
          tabIndex={-1}
        >
          {children}
        </span>
      </div>
      <Menu {...bindMenu(contextMenuState)}>
        <MenuItem {...bindTrigger(editDialogState)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setInsertDirection("right");
            insertTokenDialogState.open();
            contextMenuState.close();
          }}
        >
          <ListItemIcon>
            <ArrowForward fontSize="small" />
          </ListItemIcon>
          <ListItemText>Insert tokens right</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setInsertDirection("left");
            insertTokenDialogState.open();
            contextMenuState.close();
          }}
        >
          <ListItemIcon>
            <ArrowBack fontSize="small" />
          </ListItemIcon>
          <ListItemText>Insert tokens left</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={async () => {
            const { confirmed } = await confirm({
              description: "This action is permanent!",
            });

            if (confirmed) {
              onDelete(data);
            }

            contextMenuState.close();
          }}
        >
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      <Dialog {...bindDialog(editDialogState)}>
        <DialogTitle>{"Edit Token"}</DialogTitle>
        <DialogContent>
          <JsonEditor
            data={editedToken}
            setData={(newTokenData) => {
              setEditedToken(newTokenData as Token);
              onUpdate(data, newTokenData as Token);
            }}
            theme={
              theme.palette.mode === "dark" ? githubDarkTheme : githubLightTheme
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              contextMenuState.close();
              editDialogState.close();
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog fullWidth {...bindDialog(insertTokenDialogState)}>
        <DialogTitle>
          {`Insert tokens ${insertDirection === "right" ? "right" : "left"}`}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter one or more tokens separated by whitespace:
          </Typography>
          <FormControl fullWidth>
            <DirWrapper isRtl={isRtl}>
              <TextField
                autoFocus
                value={tokenText}
                onChange={(e) => setTokenText(e.target.value)}
                label="Token text"
                fullWidth
                variant="outlined"
                error={tokenText.trim().length === 0}
                helperText={
                  tokenText.trim().length === 0
                    ? "Minimum 1 character required"
                    : ""
                }
              />
            </DirWrapper>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => insertTokenDialogState.close()}>Cancel</Button>
          <Button
            onClick={handleInsertTokens}
            disabled={tokenText.trim().length === 0}
          >
            Insert
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const FIXED_COL_WIDTH = 75;

export default function CollationEditor({ id }: { id: Collation["id"] }) {
  const collations = useDataStore((store) => store.collations);
  const collation = collations.find((o) => o.id === id);

  if (!collation) {
    enqueueSnackbar("No such collation found", { variant: "error" });
    return <Navigate to="/" />;
  }

  const { alignmentTable } = collation;

  if (!alignmentTable) {
    const deleteCollation = useDataStore((store) => store.deleteCollation);
    const navigate = useNavigate();
    return (
      <Container maxWidth="sm">
        <Alert
          variant="filled"
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<Delete />}
              onClick={() => {
                deleteCollation(collation.id);
                navigate({ to: "/" });
              }}
            >
              Delete
            </Button>
          }
        >
          <AlertTitle>Error</AlertTitle>
          The selected collation table could not be loaded. Please delete the
          file and re-import it.
        </Alert>
      </Container>
    );
  }
  const [isRtl, setIsRtl] = React.useState(collation.dir === Dir.RTL);
  const [columnSizing, setColumnSizing] = React.useState<MRT_ColumnSizingState>(
    {}
  );

  const { table: tableColumns, witnesses: tableRows } = alignmentTable;
  const [numCols, setNumCols] = React.useState(tableColumns.length);
  const [data, setData] = React.useState<Row[]>(
    getReactTableData(alignmentTable)
  );

  const [activeToken, setActiveToken] = React.useState<Token | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const flattenedTokens = React.useMemo(() => {
    let tokens: Token[] = [];
    data.map((row) => {
      for (const [key, value] of Object.entries(row)) {
        if (!(typeof value === "string" || value instanceof String)) {
          tokens.push(...value.map((v) => v));
        }
      }
    });
    return tokens;
  }, [data]);

  const updateCollation = useDataStore((store) => store.updateCollation);
  const exportCollation = useDataStore((store) => store.exportCollation);

  const handleUpdateData = React.useCallback(
    (newData: Row[]) => {
      setData(newData);
      updateCollation({
        ...collation,
        alignmentTable: getAlignmentTable(newData),
      });
    },
    [collation]
  );

  const handleUpdateToken = React.useCallback(
    (originalToken: Token, updatedToken: Token) => {
      // Get the token's row and column
      const tokenRow = originalToken.collatexEditorTokenRow as number;
      const tokenCol = originalToken.collatexEditorTokenCol as number;
      const tokenId = originalToken.collatexEditorTokenId as string;

      // Create a new data array by copying the current data
      const newData = [...data];

      // Find and update the token
      newData[tokenRow][tokenCol] = newData[tokenRow][tokenCol].map((token) =>
        token.collatexEditorTokenId === tokenId
          ? { ...token, ...updatedToken }
          : token
      );

      // Update the data
      handleUpdateData(newData);

      // Show success message
      enqueueSnackbar("Token updated successfully", { variant: "success" });
    },
    [data, handleUpdateData]
  );

  const handleDeleteToken = React.useCallback(
    (tokenToDelete: Token) => {
      // Get the token's row and column
      const tokenRow = tokenToDelete.collatexEditorTokenRow as number;
      const tokenCol = tokenToDelete.collatexEditorTokenCol as number;
      const tokenId = tokenToDelete.collatexEditorTokenId as string;

      // Create a new data array by copying the current data
      const newData = [...data];

      // Filter out the token to delete from the specific cell
      newData[tokenRow][tokenCol] = newData[tokenRow][tokenCol].filter(
        (token) => token.collatexEditorTokenId !== tokenId
      );

      // Update the data
      handleUpdateData(newData);
      enqueueSnackbar("Token Deleted!", { variant: "success" });
    },
    [data, handleUpdateData]
  );

  const handleInsertTokens = React.useCallback(
    (originalToken: Token, direction: "left" | "right", newTokens: Token[]) => {
      // Get the token's row and column
      const tokenRow = originalToken.collatexEditorTokenRow as number;
      const tokenCol = originalToken.collatexEditorTokenCol as number;
      const tokenId = originalToken.collatexEditorTokenId as string;

      // Create a new data array by copying the current data
      const newData = [...data];

      // Find the index of the original token in the cell
      const cellTokens = newData[tokenRow][tokenCol];
      const tokenIndex = cellTokens.findIndex(
        (t) => t.collatexEditorTokenId === tokenId
      );

      if (tokenIndex === -1) {
        // Token not found, just return
        return;
      }

      // Reorder tokens based on their positions
      let tokenOrder = -1;
      for (let col = 0; col < numCols; col++) {
        newData[tokenRow][col] = newData[tokenRow][col].map((t) => ({
          ...t,
          collatexEditorTokenOrder: tokenOrder++,
        }));
      }

      // Insert the new tokens at the correct position
      const adjustedDirection = !isRtl
        ? direction
        : direction === "right"
          ? "left"
          : "right";
      const insertIndex =
        adjustedDirection === "right" ? tokenIndex + 1 : tokenIndex;

      // Update the token order for the new tokens
      const baseOrder = cellTokens[tokenIndex]
        .collatexEditorTokenOrder as number;
      const updatedNewTokens = newTokens.map((token, idx) => ({
        ...token,
        collatexEditorTokenOrder:
          adjustedDirection === "right"
            ? baseOrder + 1 + idx
            : baseOrder - newTokens.length + idx,
      }));

      // Insert the new tokens
      newData[tokenRow][tokenCol] = [
        ...cellTokens.slice(0, insertIndex),
        ...updatedNewTokens,
        ...cellTokens.slice(insertIndex),
      ];

      // Update the data
      handleUpdateData(newData);

      // Show success message
      enqueueSnackbar(`${newTokens.length} token(s) inserted ${direction}`, {
        variant: "success",
      });
    },
    [data, handleUpdateData, numCols]
  );

  React.useEffect(() => {
    setIsRtl(collation.dir === Dir.RTL);
    setData(getReactTableData(alignmentTable));
  }, [collation]);

  React.useEffect(() => {
    setColumnWidth();
  }, [data]);

  const handleInsertColumn = ({
    column,
    side,
  }: {
    column: MRT_Column<Row, any>;
    side: "right" | "left";
  }) => {
    const newData = data.map((row) => {
      const col = Number(column.id);
      let newRow: Row = { witness: row.witness };
      [...Array(numCols)].forEach((_, i) => {
        if (i < col) {
          newRow[i] = row[i];
        } else if (i > col) {
          newRow[i + 1] = row[i];
        }
      });
      if (side === "right") {
        newRow[col] = row[col];
        newRow[col + 1] = [];
      } else {
        newRow[col] = [];
        newRow[col + 1] = row[col];
      }
      return newRow;
    });
    handleUpdateData(newData);
    setNumCols((n) => n + 1);
  };

  const handleDeleteColumn = ({ column }: { column: MRT_Column<Row, any> }) => {
    if (disableDeleteColumn({ column })) {
      return;
    }
    const newData = data.map((row) => {
      let newRow = { ...row };
      const col = Number(column.id);
      delete newRow[col];
      Object.entries(row).forEach(([key, value]) => {
        if (Number(key) > col) {
          const newCol = Number(key) - 1;
          const newTokens = (value as any).map((t: any) => ({
            ...t,
            collatexEditorTokenCol: newCol,
          }));
          newRow[newCol] = newTokens;
        }
      });
      return newRow;
    });
    handleUpdateData(newData);
    setNumCols((n) => n - 1);
  };

  const disableDeleteColumn = ({
    column,
  }: {
    column: MRT_Column<Row, any>;
  }) => {
    return flattenedTokens.some(
      (tok) => tok.collatexEditorTokenCol === Number(column.id)
    );
  };

  const setColumnWidth = () => {
    let newColumnSizing: MRT_ColumnSizingState = {};
    const rows = table.getRowModel();
    const cols = table.getAllColumns();
    cols.forEach((column) => {
      if (isNumeric(column.id)) {
        const cellLengths = rows.flatRows.map((row, r) => {
          const cellTokens = flattenedTokens.filter(
            (t) =>
              t.collatexEditorTokenCol == Number(column.id) &&
              t.collatexEditorTokenRow == r
          );
          const numTokens = cellTokens.length;
          const cellText = cellTokens.map((t) => t.n || t.t || "").join(" ");
          return getTextWidth(cellText) + 50 * numTokens + 50;
        });
        const calculatedLen = Math.max(...cellLengths);
        newColumnSizing[column.id] =
          calculatedLen > FIXED_COL_WIDTH ? calculatedLen : FIXED_COL_WIDTH;
      } else {
        newColumnSizing[column.id] = FIXED_COL_WIDTH;
      }
    });
    setColumnSizing(newColumnSizing);
  };

  const columns = React.useMemo<MRT_ColumnDef<Row>[]>(
    () => [
      {
        id: "witness",
        accessorKey: "witness",
        header: "Witness",
        size: 100,
        enableColumnActions: false,
        muiTableBodyCellProps: { sx: { fontSize: "1.5em" } },
      },
      ...[...Array(numCols)].map((_, i) => {
        return {
          id: i.toString(),
          accessorKey: i.toString(),
          header: i.toString(),
          size: 300,
          Cell: ({ renderedCellValue }: any) => {
            return (
              <div
                tabIndex={-1}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  flexGrow: 1,
                }}
              >
                {(renderedCellValue as Cell).map((c, d) => [
                  <DraggableToken
                    id={c.collatexEditorTokenId as string}
                    key={d}
                    data={c}
                    onUpdate={handleUpdateToken}
                    onDelete={handleDeleteToken}
                    onInsertTokens={handleInsertTokens}
                    isRtl={isRtl}
                  >
                    <TableToken token={c} />
                  </DraggableToken>,
                ])}
              </div>
            );
          },
        };
      }),
    ],
    []
  );

  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const columnVirtualizerInstanceRef =
    React.useRef<MRT_ColumnVirtualizer>(null);
  const rowVirtualizerInstanceRef = React.useRef<MRT_RowVirtualizer>(null);

  const table = useMaterialReactTable({
    columns,
    data,
    autoResetPageIndex: false,
    enableBottomToolbar: true,
    enableColumnResizing: true,
    enableColumnVirtualization: true,
    enableColumnFilters: false,
    enableGlobalFilter: true,
    enableGlobalFilterModes: false,
    enablePagination: false,
    enableColumnPinning: true,
    enableRowActions: false,
    enableRowOrdering: true,
    enableRowNumbers: false,
    enableRowVirtualization: true,
    enableRowPinning: true,
    rowPinningDisplayMode: "top-and-bottom",
    enableKeyboardShortcuts: true,
    enableSorting: false,
    enableStickyHeader: true,
    enableStickyFooter: true,
    enableToolbarInternalActions: false,
    state: { columnSizing },
    initialState: {
      columnPinning: {
        left: ["mrt-row-drag", "mrt-row-pin", "witness"],
      },
    },
    onColumnSizingChange: (s) => {
      setColumnSizing(s);
    },
    columnVirtualizerInstanceRef,
    rowVirtualizerInstanceRef,
    rowVirtualizerOptions: { overscan: 5 },
    columnVirtualizerOptions: { overscan: 5, isRtl },
    muiRowDragHandleProps: ({ table }) => ({
      onDragEnd: () => {
        const { draggingRow, hoveredRow } = table.getState();
        if (hoveredRow?.index && draggingRow) {
          data.splice(
            hoveredRow.index,
            0,
            data.splice(draggingRow.index, 1)[0]
          );
          handleUpdateData([...data]);
        }
      },
    }),
    muiTableContainerProps: {
      ref: tableContainerRef,
      sx: { maxHeight: "calc(100vh - 200px)", overscrollBehaviorX: "contain" },
    },
    muiTableProps: {
      sx: {
        userSelect: "none",
        webkitUserSelect: "none",
        khtmlUserSelect: "none",
        mozUserSelect: "none",
        msUserSelect: "none",
        "&:focus": {
          outline: "none",
        },
      },
      tabIndex: -1,
    },
    muiTablePaperProps: { variant: "outlined", elevation: 0 },
    muiTableBodyRowProps: { hover: false },
    muiTableBodyCellProps: (props) => {
      const cell = props.cell as any;
      const col = Number(cell.column.id);
      const row = Number(cell.row.id);
      const { setNodeRef, isOver } = useDroppable({
        id: `${row}_${col}`,
        data: { row, col },
      });
      return {
        ref: setNodeRef,
        sx: {
          borderWidth: 1,
          borderColor: (theme) => theme.palette.divider,
          borderStyle: "solid",
          backgroundColor: (theme) =>
            isOver ? theme.palette.divider : "inherit",
        },
      };
    },
    renderTopToolbarCustomActions: () => {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            flexGrow: 1,
          }}
        >
          <Button
            color="primary"
            size="small"
            onClick={() => exportCollation(collation.id)}
            variant="contained"
            startIcon={<Download />}
          >
            Export
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <FormControl>
            <RadioGroup
              row
              value={collation.dir}
              onChange={(e) => {
                const dir = e.target.value as Dir;
                updateCollation({ ...collation, dir });
                setIsRtl(dir === Dir.RTL);
              }}
            >
              <FormControlLabel value="rtl" control={<Radio />} label="RTL" />
              <FormControlLabel value="ltr" control={<Radio />} label="LTR" />
            </RadioGroup>
          </FormControl>
        </Box>
      );
    },
    renderColumnActionsMenuItems: ({
      closeMenu,
      column,
    }: {
      closeMenu: () => void;
      column: MRT_Column<Row, any>;
    }) => [
      <MenuItem
        key={"item-1"}
        onClick={() => {
          handleInsertColumn({ column, side: "right" });
          closeMenu();
        }}
      >
        <ListItemIcon>
          <ArrowForward />
        </ListItemIcon>
        <ListItemText>Insert column right</ListItemText>
      </MenuItem>,
      <MenuItem
        key={"item-2"}
        onClick={() => {
          handleInsertColumn({ column, side: "left" });
          closeMenu();
        }}
      >
        <ListItemIcon>
          <ArrowBack />
        </ListItemIcon>
        <ListItemText>Insert column left</ListItemText>
      </MenuItem>,
      <Divider key="divider-1" />,
      <MenuItem
        key={"item-5"}
        onClick={() => {
          handleDeleteColumn({ column });
          closeMenu();
        }}
        disabled={disableDeleteColumn({ column })}
      >
        <ListItemIcon>
          <DeleteForever />
        </ListItemIcon>
        <ListItemText>Remove column</ListItemText>
      </MenuItem>,
    ],
    muiTopToolbarProps: {
      //   sx: { direction: "ltr" },
    },
    muiBottomToolbarProps: {
      sx: { direction: collation.dir },
    },
    renderBottomToolbarCustomActions: () => {
      return (
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Box sx={{ flexGrow: isRtl ? undefined : 1 }} />
          <IconButton
            onClick={() => {
              const totalSize =
                columnVirtualizerInstanceRef.current?.getTotalSize();
              tableContainerRef.current?.scrollTo({
                left: isRtl && totalSize ? -1 * totalSize : 0,
                behavior: "smooth",
              });
            }}
          >
            <FirstPage />
          </IconButton>
          <IconButton
            onClick={() => {
              tableContainerRef.current?.scrollTo({
                left:
                  tableContainerRef.current?.scrollLeft -
                  tableContainerRef.current.clientWidth,
                behavior: "smooth",
              });
            }}
          >
            <NavigateBefore />
          </IconButton>
          <IconButton
            onClick={() => {
              tableContainerRef.current?.scrollTo({
                left:
                  tableContainerRef.current?.scrollLeft +
                  tableContainerRef.current.clientWidth,
                behavior: "smooth",
              });
            }}
          >
            <NavigateNext />
          </IconButton>
          <IconButton
            onClick={() => {
              tableContainerRef.current?.scrollTo({
                left: isRtl
                  ? 0
                  : columnVirtualizerInstanceRef.current?.getTotalSize() || 0,
                behavior: "smooth",
              });
            }}
          >
            <LastPage />
          </IconButton>
        </Box>
      );
    },
  });

  return (
    <React.Fragment>
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          sx={{ color: "text.secondary" }}
        >
          CollateX Editor
        </Link>
        <Typography sx={{ color: "text.primary" }}>{collation.name}</Typography>
      </Breadcrumbs>
      <DndContext
        modifiers={[restrictToHorizontalAxis, restrictToWindowEdges]}
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={(event: DragStartEvent) => {
          const { active } = event;
          const token =
            flattenedTokens.find(
              ({ collatexEditorTokenId }) =>
                (active.id as string) === collatexEditorTokenId
            ) || null;
          setActiveToken(token);
        }}
        onDragEnd={(event: DragEndEvent) => {
          const { active, over } = event;

          if (!over || !active) return;

          const activeToken = active.data.current as Token;
          const activeTokenOrder = activeToken.collatexEditorTokenOrder as any;
          const activeTokenCol = activeToken?.collatexEditorTokenCol as any;
          const activeTokenRow = activeToken?.collatexEditorTokenRow as any;

          const overCol = over.data.current?.col as any;

          let newData = [...data];

          if (activeTokenCol > overCol) {
            const tokensToMove = flattenedTokens.filter(
              (t) =>
                t.collatexEditorTokenRow === activeTokenRow &&
                t.collatexEditorTokenOrder <= activeTokenOrder &&
                t.collatexEditorTokenCol <= activeTokenCol &&
                t.collatexEditorTokenCol > overCol
            );
            const tokensToMoveIds = tokensToMove.map(
              (t) => t.collatexEditorTokenId
            );
            for (let i = overCol; i <= activeTokenCol; i++) {
              newData[activeTokenRow][i] = newData[activeTokenRow][i].filter(
                (t) => !tokensToMoveIds.includes(t.collatexEditorTokenId)
              );
            }
            newData[activeTokenRow][overCol] = [
              ...newData[activeTokenRow][overCol],
              ...tokensToMove,
            ].sort(
              (a: any, b: any) =>
                a.collatexEditorTokenOrder - b.collatexEditorTokenOrder
            );
          } else if (overCol > activeTokenCol) {
            const tokensToMove = flattenedTokens.filter(
              (t) =>
                t.collatexEditorTokenRow === activeTokenRow &&
                t.collatexEditorTokenOrder >= activeTokenOrder &&
                t.collatexEditorTokenCol >= activeTokenCol &&
                t.collatexEditorTokenCol < overCol
            );
            const tokensToMoveIds = tokensToMove.map(
              (t) => t.collatexEditorTokenId
            );
            for (let i = activeTokenCol; i <= overCol; i++) {
              newData[activeTokenRow][i] = newData[activeTokenRow][i].filter(
                (t) => !tokensToMoveIds.includes(t.collatexEditorTokenId)
              );
            }
            newData[activeTokenRow][overCol] = [
              ...tokensToMove,
              ...newData[activeTokenRow][overCol],
            ].sort(
              (a: any, b: any) =>
                a.collatexEditorTokenOrder - b.collatexEditorTokenOrder
            );
          } else {
            return;
          }
          return handleUpdateData(newData);
        }}
      >
        <DirWrapper isRtl={isRtl}>
          <MaterialReactTable table={table} />
        </DirWrapper>
        <DragOverlay>
          {activeToken ? <DraggingToken token={activeToken} /> : null}
        </DragOverlay>
      </DndContext>
    </React.Fragment>
  );
}
