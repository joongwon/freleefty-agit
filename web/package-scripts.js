module.exports = {
  scripts: {
    dev: 'next dev',
    build: 'next build',
    default: 'next start',
    lint: 'next lint',
    pg: {
      build: 'dotenv -e .env -- pgtyped -c pgtyped.json',
      dev: 'dotenv -e .env -- pgtyped -w -c pgtyped.json'
    },
    kanel: 'dotenv -e .env -- kanel',
    mig: {
      default: 'dotenv -e .env -- node-pg-migrate',
      prod: 'node-pg-migrate up'
    }
  }
};
