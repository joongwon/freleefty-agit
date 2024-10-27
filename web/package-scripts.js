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
    migrate: 'dotenv -e .env -- node-pg-migrate',
    mig: {
      prod: 'node-pg-migrate up'
    }
  }
};
