import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { NewReleasesClient } from "./NewReleasesClient";

export const metadata: Metadata = buildMetadata({
  title: "New Releases",
  description:
    "Discover the latest Hamplard courses published in the last 90 days.",
  path: "/courses/new",
});

export default function NewReleasesPage() {
  return <NewReleasesClient />;
}
