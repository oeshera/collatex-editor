import { Container, Typography } from "@mui/material";
import { createLazyFileRoute } from "@tanstack/react-router";
import CollationsList from "../components/CollationsList";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Container>
      <Typography
        variant="h4"
        component="h1"
        color="primary"
        sx={{ textAlign: "center", my: 6 }}
      >
        CollateX Editor
      </Typography>
      <CollationsList />
    </Container>
  );
}
