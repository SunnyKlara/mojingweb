# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Engineering baseline: ESLint, Prettier, EditorConfig, Husky, lint-staged, Commitlint
- pnpm workspace with `frontend`, `backend`, `shared` packages
- Shared Zod schemas and Socket.io event constants in `shared/`
- TypeScript migration for backend (Express + Socket.io + Mongoose)
- Environment variable validation via Zod
- Docker Compose for local development (api + mongo + redis + mongo-express)
- GitHub Actions CI (lint + typecheck + build)

### Changed

- Project structure: introduced `shared/` package for type-safe contract between frontend and backend

### Fixed

- _(pending phase 1)_ Mailer field mismatch in visitor notification
- _(pending phase 1)_ Visitor chat history 401 due to JWT middleware on public route
- _(pending phase 1)_ Socket.io `sessionId` spoofing via signed token
