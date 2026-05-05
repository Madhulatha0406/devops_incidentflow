const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const loadLocalEnv = () => {
  if (typeof process.loadEnvFile !== "function") {
    return;
  }

  const candidates = [
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../backend/.env"),
    path.resolve(__dirname, "../frontend/.env")
  ];

  candidates.forEach((candidate) => {
    if (fs.existsSync(candidate)) {
      process.loadEnvFile(candidate);
    }
  });
};

loadLocalEnv();

if (!process.env.SONAR_HOST_URL || !process.env.SONAR_TOKEN) {
  console.error("SONAR_HOST_URL and SONAR_TOKEN must be set before running the SonarQube scan.");
  process.exit(1);
}

const scannerCommand = process.platform === "win32" ? "sonar-scanner.bat" : "sonar-scanner";
const result = spawnSync(
  scannerCommand,
  [
    `-Dsonar.host.url=${process.env.SONAR_HOST_URL}`,
    `-Dsonar.token=${process.env.SONAR_TOKEN}`
  ],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env
  }
);

if (result.error) {
  console.error("Failed to launch sonar-scanner. Make sure SonarScanner is installed and available on PATH.");
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
