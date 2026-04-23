// build.js
const esbuild = require("esbuild");
const { rmSync } = require("fs");

// Hapus dist lama
rmSync("dist", { recursive: true, force: true });

// build.js

esbuild.build({
  entryPoints: ["app/server.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  sourcemap: true,
  tsconfig: "tsconfig.json",
  external: [
    "express",
    "dotenv",        // jangan dibundle
    "path",
    "fs",
    "bcrypt"
  ],
  outdir: "dist",
  logLevel: "info",
  minify: false,
}).then(() => {
  console.log("✅ Build success");
}).catch(() => process.exit(1));

