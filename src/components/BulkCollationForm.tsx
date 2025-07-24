import {
  AttachFile,
  Cancel,
  CheckCircle,
  Delete,
  Error,
  Restore,
  Save,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { MuiFileInput } from "mui-file-input";
import { enqueueSnackbar } from "notistack";
import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { Dir, tableSchema, useDataStore } from "../store";

interface ProcessedFile {
  id: string;
  originalFile: File;
  name: string;
  alignmentTable: z.infer<typeof tableSchema> | null;
  error: string | null;
  witnessCount?: number;
  columnCount?: number;
}

const bulkFormSchema = z.object({
  files: z.array(z.instanceof(File)).min(1, "At least one file is required"),
  dir: z.nativeEnum(Dir).default(Dir.LTR),
});

export default function BulkCollationForm({
  closeDialog,
}: {
  closeDialog: () => void;
}) {
  const data = useDataStore((store) => store.collations);
  const importCollation = useDataStore((store) => store.importCollation);

  const existingNames = React.useMemo(() => data.map((o) => o.name), [data]);

  const [processedFiles, setProcessedFiles] = React.useState<ProcessedFile[]>(
    []
  );
  const [isProcessing, setIsProcessing] = React.useState(false);

  const form = useForm({
    defaultValues: {
      files: [] as File[],
      dir: Dir.LTR,
    },
    onSubmit: async ({ value }) => {
      // Import all valid collations
      const validFiles = processedFiles.filter(
        (file) => file.alignmentTable && !file.error
      );

      if (validFiles.length === 0) {
        enqueueSnackbar("No valid files to import", { variant: "error" });
        return;
      }

      let successCount = 0;
      for (const file of validFiles) {
        try {
          importCollation({
            id: file.id,
            name: file.name,
            dir: value.dir,
            alignmentTable: file.alignmentTable,
          });
          successCount++;
        } catch (error) {
          console.error("Failed to import:", file.name, error);
        }
      }

      if (successCount > 0) {
        enqueueSnackbar(
          `Successfully imported ${successCount} collation${
            successCount > 1 ? "s" : ""
          }`,
          { variant: "success" }
        );
        closeDialog();
      } else {
        enqueueSnackbar("Failed to import collations", { variant: "error" });
      }
    },
    validatorAdapter: zodValidator(),
  });

  const processFiles = React.useCallback(async (files: File[]) => {
    if (files.length === 0) {
      setProcessedFiles([]);
      return;
    }

    setIsProcessing(true);
    const processed: ProcessedFile[] = [];

    for (const file of files) {
      const processedFile: ProcessedFile = {
        id: uuidv4(),
        originalFile: file,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        alignmentTable: null,
        error: null,
      };

      try {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file, "UTF-8");
        });

        const jsonData = JSON.parse(content);
        const validatedData = tableSchema.parse(jsonData);

        processedFile.alignmentTable = validatedData;
        processedFile.witnessCount = validatedData.witnesses.length;
        processedFile.columnCount = validatedData.table.length;
      } catch (err) {
        processedFile.error =
          err instanceof Error ? (err as any).message : "Invalid JSON file";
      }

      processed.push(processedFile);
    }

    setProcessedFiles(processed);
    setIsProcessing(false);
  }, []);

  const updateFileName = (fileId: string, newName: string) => {
    setProcessedFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, name: newName } : file
      )
    );
  };

  const removeFile = (fileId: string) => {
    setProcessedFiles((prev) => prev.filter((file) => file.id !== fileId));

    // Update form files array
    const remainingFiles = processedFiles
      .filter((file) => file.id !== fileId)
      .map((file) => file.originalFile);

    form.setFieldValue("files", remainingFiles);
  };

  const validateNames = () => {
    const names = processedFiles.map((file) => file.name);
    const duplicates = names.filter(
      (name, index) => names.indexOf(name) !== index
    );
    const existingConflicts = names.filter((name) =>
      existingNames.includes(name)
    );

    return {
      duplicates: [...new Set(duplicates)],
      existingConflicts: [...new Set(existingConflicts)],
    };
  };

  const { duplicates, existingConflicts } = validateNames();
  const hasValidationErrors =
    duplicates.length > 0 || existingConflicts.length > 0;
  const validFilesCount = processedFiles.filter(
    (file) => file.alignmentTable && !file.error
  ).length;

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      sx={{ display: "flex", flexDirection: "column", gap: 3, py: 2 }}
    >
      {/* File Upload Section */}
      <div>
        <form.Field
          name="files"
          validators={{
            onChange: bulkFormSchema.shape.files,
          }}
          children={(field) => (
            <MuiFileInput
              multiple
              value={field.state.value}
              onChange={(files) => {
                const fileArray = files ? Array.from(files) : [];
                field.handleChange(fileArray);
                processFiles(fileArray);
              }}
              placeholder="Select JSON files"
              helperText="Select multiple CollateX JSON files to import"
              fullWidth
              InputProps={{
                inputProps: {
                  accept: "application/json,.json",
                },
                startAdornment: <AttachFile />,
              }}
            />
          )}
        />
      </div>

      {/* Global Text Direction Setting */}
      {processedFiles.length > 0 && (
        <div>
          <form.Field
            name="dir"
            children={(field) => (
              <FormControl fullWidth>
                <Typography variant="subtitle1" gutterBottom>
                  Text Direction (applies to all files)
                </Typography>
                <RadioGroup
                  row
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as Dir)}
                >
                  <FormControlLabel
                    value="rtl"
                    control={<Radio />}
                    label="Right-to-left"
                  />
                  <FormControlLabel
                    value="ltr"
                    control={<Radio />}
                    label="Left-to-right"
                  />
                </RadioGroup>
                <FormHelperText>
                  This setting will be applied to all imported collations
                </FormHelperText>
              </FormControl>
            )}
          />
        </div>
      )}

      {/* Validation Errors */}
      {hasValidationErrors && (
        <Paper
          sx={{ p: 2, bgcolor: "error.light", color: "error.contrastText" }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Validation Errors:
          </Typography>
          {duplicates.length > 0 && (
            <Typography variant="body2">
              • Duplicate names: {duplicates.join(", ")}
            </Typography>
          )}
          {existingConflicts.length > 0 && (
            <Typography variant="body2">
              • Names already exist: {existingConflicts.join(", ")}
            </Typography>
          )}
        </Paper>
      )}

      {/* Files Preview Table */}
      {processedFiles.length > 0 && (
        <div>
          <Typography variant="subtitle1" gutterBottom>
            Files to Import ({validFilesCount} valid)
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Witnesses</TableCell>
                  <TableCell>Columns</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedFiles.map((file) => {
                  const hasError =
                    file.error ||
                    duplicates.includes(file.name) ||
                    existingConflicts.includes(file.name);

                  return (
                    <TableRow key={file.id}>
                      <TableCell>
                        {isProcessing ? (
                          <Chip label="Processing..." size="small" />
                        ) : hasError ? (
                          <Chip
                            icon={<Error />}
                            label="Error"
                            color="error"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<CheckCircle />}
                            label="Valid"
                            color="success"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={file.name}
                          onChange={(e) =>
                            updateFileName(file.id, e.target.value)
                          }
                          error={
                            duplicates.includes(file.name) ||
                            existingConflicts.includes(file.name)
                          }
                          helperText={
                            duplicates.includes(file.name)
                              ? "Duplicate name"
                              : existingConflicts.includes(file.name)
                                ? "Name already exists"
                                : undefined
                          }
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>{file.witnessCount || "-"}</TableCell>
                      <TableCell>{file.columnCount || "-"}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => removeFile(file.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {processedFiles.some((file) => file.error) && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                File Errors:
              </Typography>
              {processedFiles
                .filter((file) => file.error)
                .map((file) => (
                  <Typography key={file.id} variant="body2" color="error">
                    • {file.originalFile.name}: {file.error}
                  </Typography>
                ))}
            </Box>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Cancel />}
          onClick={closeDialog}
        >
          Cancel
        </Button>

        <Button
          color="secondary"
          startIcon={<Restore />}
          disabled={processedFiles.length === 0}
          onClick={() => {
            form.reset();
            setProcessedFiles([]);
          }}
        >
          Reset
        </Button>

        <div style={{ flexGrow: 1 }} />

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              variant="contained"
              type="submit"
              disabled={
                !canSubmit ||
                isSubmitting ||
                validFilesCount === 0 ||
                hasValidationErrors ||
                isProcessing
              }
              startIcon={<Save />}
            >
              Import {validFilesCount} Collation
              {validFilesCount !== 1 ? "s" : ""}
            </Button>
          )}
        />
      </Box>
    </Box>
  );
}
