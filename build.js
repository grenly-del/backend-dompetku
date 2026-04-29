// build.js
const esbuild = require("esbuild");
const { execFileSync } = require("child_process");
const { rmSync } = require("fs");

execFileSync(process.execPath, [require.resolve("prisma/build/index.js"), "generate"], {
  stdio: "inherit",
});

// Hapus dist lama
rmSync("dist", { recursive: true, force: true });

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

