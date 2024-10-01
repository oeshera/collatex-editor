import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/doc")({
  component: Doc,
});

function Doc() {
  return <div>Hello from Documentation!</div>;
}
