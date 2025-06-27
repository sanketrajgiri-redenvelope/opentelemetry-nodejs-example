FROM node:22.13.1-alpine AS build

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .

FROM node:22.13.1-alpine AS final-image

WORKDIR /app
COPY --chown=node:node --from=build /app /app
USER node
CMD ["-r","./telemetry.js","server.js"]
