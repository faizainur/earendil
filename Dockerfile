# SvelteKit SSR container (adapter-node). Build output in `build/` is self-contained,
# so the runtime stage needs no node_modules. Used by the blog-frontend deployment —
# see k8s-platform-manifests/applications/blog-frontend/ and README.md.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS output
WORKDIR /app
ENV NODE_ENV=production
# PORT (listen) and ORIGIN (canonical URL, sent in SSR/CSP contexts) come from the
# Deployment's env in Git — don't bake the domain in here.
COPY --from=build /app/build ./build
EXPOSE 3000
USER node
CMD ["node", "build"]
