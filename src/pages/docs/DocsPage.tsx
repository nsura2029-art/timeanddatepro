// src/pages/docs/DocsPage.tsx
// Single docs entry point. App.tsx wires the /docs/* prefix into here via
// <DocsPage pathname={...} />; this component picks the page from URL and
// renders the right content. Adding a new page = one branch here (or a new
// sub-component imported above). Each page wraps in <DocLayout>.

import React from "react";
import DocLayout from "../../components/docs/DocLayout";
import EndpointRef from "../../components/docs/EndpointRef";
import { parseDocsPath } from "../../utils/docRoutes";
import { findEndpoint, ENDPOINT_CATALOG } from "../../data/docs/endpointCatalog";

// Content
import IntroductionPage from "./content/Introduction";
import QuickstartPage from "./content/Quickstart";
import AuthenticationPage from "./content/Authentication";
import ErrorsPage from "./content/Errors";
import ApiOverviewPage from "./content/ApiOverview";
import NodeJsSdkPage from "./content/NodeJsSdk";
import PythonSdkPage from "./content/PythonSdk";
import CurlSdkPage from "./content/CurlSdk";
import { integrations } from "./content/integrations";
import ChangelogPage from "./content/Changelog";
import SupportPage from "./content/Support";

export interface DocsPageProps {
  pathname: string;
}

export default function DocsPage({ pathname }: DocsPageProps) {
  const route = parseDocsPath(pathname);
  // Default: introduction
  if (!route) {
    return <DocLayout pathname={pathname}><IntroductionPage /></DocLayout>;
  }

  const { sectionId, fullSlug } = route;

  // Section landings default to the first page
  const slug = fullSlug;

  // Getting Started
  if (sectionId === "getting-started") {
    if (slug === "introduction") return <DocLayout pathname={pathname}><IntroductionPage /></DocLayout>;
    if (slug === "quickstart") return <DocLayout pathname={pathname}><QuickstartPage /></DocLayout>;
    if (slug === "authentication") return <DocLayout pathname={pathname}><AuthenticationPage /></DocLayout>;
    if (slug === "errors") return <DocLayout pathname={pathname}><ErrorsPage /></DocLayout>;
  }

  // API Reference
  if (sectionId === "api-reference") {
    if (slug === "overview") return <DocLayout pathname={pathname}><ApiOverviewPage /></DocLayout>;
    const endpoint = findEndpoint(slug);
    if (endpoint) return <DocLayout pathname={pathname}><EndpointRef endpoint={endpoint} /></DocLayout>;
  }

  // SDKs
  if (sectionId === "sdks") {
    if (slug === "nodejs") return <DocLayout pathname={pathname}><NodeJsSdkPage /></DocLayout>;
    if (slug === "python") return <DocLayout pathname={pathname}><PythonSdkPage /></DocLayout>;
    if (slug === "curl") return <DocLayout pathname={pathname}><CurlSdkPage /></DocLayout>;
  }

  // Integrations
  if (sectionId === "integrations") {
    const Component = integrations[slug];
    if (Component) return <DocLayout pathname={pathname}><Component /></DocLayout>;
  }

  // Resources
  if (sectionId === "resources") {
    if (slug === "changelog") return <DocLayout pathname={pathname}><ChangelogPage /></DocLayout>;
    if (slug === "support") return <DocLayout pathname={pathname}><SupportPage /></DocLayout>;
  }

  // Fallback — should be unreachable for valid paths
  return <DocLayout pathname={pathname}><div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-[14px] text-slate-500">
    Docs page not found.
  </div></DocLayout>;
}

// Re-export so App.tsx (or anywhere) can iterate the catalog if needed.
export { ENDPOINT_CATALOG };
