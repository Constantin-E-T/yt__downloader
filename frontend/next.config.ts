import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    /**
     * Set the workspace root explicitly so Turbopack doesn't walk upward
     * and pick up the repository-level lockfile, which triggers warnings.
     */
    root: projectDir,
  },
};

export default nextConfig;
