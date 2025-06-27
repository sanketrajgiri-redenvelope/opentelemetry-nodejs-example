FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .

FROM gcr.io/distroless/nodejs22-debian12 AS final-image

WORKDIR /app
COPY --chown=nonroot:nonroot --from=build /app /app
USER nonroot
CMD ["-r", "./telemetry.js", "server.js"]