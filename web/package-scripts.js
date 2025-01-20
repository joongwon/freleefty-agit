module.exports = {
  scripts: {
    dev: "next dev",
    build: "next build",
    default: "next start",
    lint: "next lint",
    kanel: "dotenv -e .env -- kanel",
    mig: {
      default: "dotenv -e .env -- node-pg-migrate",
      prod: "node-pg-migrate up",
    },
    prettier: "prettier --write .",
  },
};
