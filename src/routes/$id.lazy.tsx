import { createLazyFileRoute } from "@tanstack/react-router";
import CollationEditor from "../components/CollationEditor";

export const Route = createLazyFileRoute("/$id")({
  component: Collation,
});

function Collation() {
  const { id } = Route.useParams();
  return <CollationEditor id={id} />;
}
