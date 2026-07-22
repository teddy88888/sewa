# ===== SEWA Platform Dockerfile =====
# Multi-stage build: development → build → production

# ---- Stage 1: Base (dependencies) ----
FROM node:24-alpine AS base
WORKDIR /workspace

RUN npm install -g pnpm@latest

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json tsconfig.base.json ./

# Copy all package.json files for dependency resolution
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/sewa/package.json ./artifacts/sewa/
COPY scripts/package.json ./scripts/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ---- Stage 2: Build ----
FROM base AS build
WORKDIR /workspace

# Copy source code
COPY . .

# Generate API client code from OpenAPI spec
RUN pnpm --filter @workspace/api-spec run codegen

# Build libraries
RUN pnpm run typecheck:libs

# Build API server
RUN pnpm --filter @workspace/api-server run build
# Build React web app
RUN pnpm --filter @workspace/sewa run build

# ---- Stage 3: Production ----
FROM node:24-alpine AS production
WORKDIR /workspace

# Copy only production artifacts
COPY --from=build /workspace/artifacts/api-server/dist ./api-server/dist
COPY --from=build /workspace/artifacts/api-server/package.json ./api-server/
COPY --from=build /workspace/artifacts/api-server/src/lib/logger.ts ./api-server/src/lib/logger.ts
COPY --from=build /workspace/artifacts/sewa/dist/public ./api-server/dist/public

# Copy node_modules (production only)
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/pnpm-lock.yaml ./
COPY --from=build /workspace/package.json ./

# Create minimal entry point script
COPY --from=build /workspace/artifacts/api-server/build.mjs ./build.mjs
COPY --from=build /workspace/lib ./lib

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV BASE_PATH=/

EXPOSE 8080

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run the API server
CMD ["node", "--enable-source-maps", "api-server/dist/index.mjs"]

