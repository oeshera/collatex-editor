import { AttachFile, Cancel, Restore, Save } from "@mui/icons-material";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  TextField,
  TextFieldProps,
} from "@mui/material";
import type { FieldApi } from "@tanstack/react-form";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { MuiFileInput, MuiFileInputProps } from "mui-file-input";
import { enqueueSnackbar } from "notistack";
import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  Collation,
  collationSchema,
  Dir,
  tableSchema,
  useDataStore,
} from "../store";

function getTextFieldProps({
  field,
}: {
  field: FieldApi<any, any, any, any>;
}): Partial<TextFieldProps> {
  const invalid = field.state.meta.isTouched && field.state.meta.errors.length;
  return {
    helperText: invalid
      ? field.state.meta.errors.join(",")
      : "Give a name to the collation. This can be changed later.",
    color: invalid ? "error" : "primary",
    focused: invalid ? true : undefined,
    FormHelperTextProps: {
      sx: {
        color: invalid ? (theme) => theme.palette.error.main : undefined,
      },
    },
  };
}

function getFileFieldProps({
  field,
}: {
  field: FieldApi<any, any, any, any>;
}): Partial<MuiFileInputProps> {
  const invalid = field.state.meta.isTouched && field.state.meta.errors.length;
  return {
    helperText: invalid
      ? "The selected file is not a valid CollateX JSON"
      : "Provide the JSON file produced by CollateX. This can be updated later.",
    color: invalid ? "error" : "primary",
    focused: invalid ? true : undefined,
    FormHelperTextProps: {
      sx: {
        color: invalid ? (theme) => theme.palette.error.main : undefined,
      },
    },
  };
}

export default function CollationForm({
  collation,
  closeDialog,
}: {
  collation?: Collation;
  closeDialog?: () => void;
}) {
  const data = useDataStore((store) => store.collations);
  const updateData = useDataStore((store) => store.importCollation);

  const names = React.useMemo(
    () => data.filter((o) => o.id !== collation?.id).map((o) => o.name),
    [data]
  );

  const [file, setFile] = React.useState<File | null>(null);
  const form = useForm({
    defaultValues: collation
      ? collationSchema.parse(collation)
      : collationSchema.parse({ id: uuidv4(), alignmentTable: null }),
    onSubmit: async ({ value, formApi: { reset } }) => {
      updateData(value);
      reset();
      setFile(null);
      closeDialog?.();
      enqueueSnackbar("Saved!", { variant: "success" });
    },
    validatorAdapter: zodValidator(),
  });

  return (
    <div>
      <Box
        component={"form"}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 2, py: 2 }}
      >
        <div>
          <form.Field
            name="name"
            validators={{
              onChange: z.string().min(3, "Name must be at least 3 characters"),
              onChangeAsyncDebounceMs: 250,
              onChangeAsync: z.string().refine(
                async (value) => {
                  await new Promise((resolve) => setTimeout(resolve, 500));
                  return !names.includes(value);
                },
                { message: "A collation with this name already exists" }
              ),
            }}
            children={(field) => {
              return (
                <TextField
                  autoFocus
                  id={field.name}
                  label={"Collation Name"}
                  name={field.name}
                  value={field.state.value}
                  //   onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  fullWidth
                  {...getTextFieldProps({ field })}
                />
              );
            }}
          />
        </div>
        <div>
          <form.Field
            name="alignmentTable"
            validators={{ onChange: tableSchema }}
            children={(field) => {
              return (
                <MuiFileInput
                  id={field.name}
                  name={field.name}
                  value={file}
                  //   onBlur={field.handleBlur}
                  onChange={(event) => {
                    if (!event) {
                      return;
                    }
                    const fileReader = new FileReader();
                    fileReader.readAsText(event as Blob, "UTF-8");
                    fileReader.onload = (e) => {
                      const content = e.target?.result;
                      if (content) {
                        field.handleChange(JSON.parse(content as string));
                        setFile(event);
                      } else {
                        field.handleChange(null);
                        setFile(null);
                      }
                    };
                  }}
                  fullWidth
                  placeholder="Select a file"
                  InputProps={{
                    inputProps: {
                      accept: "application/JSON",
                    },
                    startAdornment: <AttachFile />,
                  }}
                  {...(getFileFieldProps({ field }) as any)}
                />
              );
            }}
          />
        </div>
        <div>
          <form.Field
            name="dir"
            children={(field) => {
              return (
                <FormControl fullWidth>
                  <RadioGroup
                    row
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    // onBlur={field.handleBlur}
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
                    Set the reading direction. This can be updated later.
                  </FormHelperText>
                </FormControl>
              );
            }}
          />
        </div>
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Cancel />}
                onClick={() => closeDialog?.()}
              >
                Cancel
              </Button>
            )}
          />
          <form.Subscribe
            selector={(state) => [state.isPristine]}
            children={([isPristine]) => (
              <Button
                color="secondary"
                startIcon={<Restore />}
                disabled={isPristine}
                onClick={() => form.reset()}
              >
                Reset
              </Button>
            )}
          />
          <div style={{ flexGrow: 1 }} />
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                variant="contained"
                type="submit"
                disabled={!canSubmit}
                startIcon={<Save />}
              >
                Submit
              </Button>
            )}
          />
        </Box>
      </Box>
    </div>
  );
}
