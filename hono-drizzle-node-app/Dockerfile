FROM node:22.13.1-alpine AS build

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .

RUN npm run build

FROM node:22.13.1-alpine AS final-image

WORKDIR /app
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/node_modules ./node_modules
USER node
CMD [ "-r","./dist/tracing.js","dist/index.js"]