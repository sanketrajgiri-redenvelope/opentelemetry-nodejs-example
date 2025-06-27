# opentelemetry-nodejs-example-
Demo Application Auto Instrumented Using Otel SDK.

## Project Overview

This repository contains a collection of sample microservices applications built for demo purposes to showcase observability using OpenTelemetry and Datadog. It simulates a distributed system with services like orders, payments, products, and users, and demonstrates how traces, metrics, and logs can be collected and visualized for end-to-end monitoring.

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Node.js installed
- Access to MongoDB and Postgress

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/sanketrajgiri-redenvelope/opentelemetry-nodejs-example.git
   cd opentelemetry-nodejs-example
   ```

2. **Build and run the services using Docker Compose**
   ```bash
   docker-compose up --build
   ```

## Technology Stack

- **Backend**: Node.js with Hono
- **Database**: MongoDB, Postgres
-  **ORM**: Mongoose, Drizzle
- **Observability**: OpenTelemetry, Datadog, Prometheus
- **Containerization**: Docker, Docker Compose

## Project Structure

- `order-service/`: Contains all files related to the Order service including its Dockerfile and server logic.
- `payment-service/`: Contains all files for the Payment service.
- `product-service/`: Manages the Product service files.
- `user-service/`: Holds the User service files.
- `hono-drizzle-node-app/`: Contains Routes for a Sample Service Connecting to a Postgres Database using Drizzle ORM.
- `docker-compose.yml`: Defines how the Docker containers are built, run, and interconnect.

### Important Files

- `server.js`: Each service directory contains a `server.js` which is the entry point for that service, defining APIs and connecting to the database.
- `Dockerfile`: Used to build Docker images for each service.

## Key Endpoints

Each service offers several endpoints for interacting with the application:

- **Orders**
  - `GET /orders`: Retrieves all orders, including user details.
  - `POST /orders`: Creates a new order and updates the product stock.
  - `GET /external`: User Service (/external/users) -> Hono App (/users) -> Postgres DB

- **Payments**
  - `GET /payments`: Lists all payments.
  - `POST /payments`: Processes a payment for an order.

- **Products**
  - `GET /products`: Fetches all products.
  - `POST /products`: Adds a new product to the inventory.

- **Users**
  - `GET /users`: Returns all registered users.
  - `POST /users`: Registers a new user.
  - `GET /external/users` : Hono App (/users) -> Postgres DB

- **Hono App**
  - `GET /users`: Returns all users from Postgres DB


## Screenshots

**1. Context Propagation Across Services**

  order service ( GET /external) -> user service ( GET /external/users) -> hono app -> (GET /users) -> postgres

  ![screenshot1](./docs/Screenshot%202025-06-26%20at%204.53.41 PM.png)
  

**2.  Custom Spans for Handlers**

  `externalHandler` from `order` service for route `GET /external` is instrumented using a wrapper function to create custom spans for the handler logic.

  ![screenshot2](./docs/Screenshot%202025-06-27%20at%209.53.10 AM.png).

**3. Correlation between logs and traces**
  Application logs are correlated with trace context (trace ID and span ID) to enable unified observability across logs and traces.
  ![screenshot3](./docs/Screenshot%202025-06-27%20at%2010.02.14 AM.png)

**4. Exporting Merics** 
  Attempted to export metrics to Datadog, but metrics are not visible in the Datadog dashboard.
  As a workaround, the Prometheus exporter was enabled in the OpenTelemetry Collector to inspect the list of metrics being emitted by the application.
  
  [List of Metrics by Otel Collector](./docs/Otel-Metrics)
