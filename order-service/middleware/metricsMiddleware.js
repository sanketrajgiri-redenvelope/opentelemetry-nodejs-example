import { metrics } from "@opentelemetry/api";
import logger from "../logger.js";

const meter = metrics.getMeter("http-server")

const responseTimeHistogram = meter.createHistogram('http_request_latency_ms', {
  description: 'Duration of HTTP responses in milliseconds',
  unit: 'ms',
})

const requestCounter = meter.createCounter('http_request_count', {
  description: "Total number of HTTP requests",
})

export const responseTimeMiddleware = async (c, next) => {
    const start = performance.now()
    await next(); // Continue to next middleware or handler
    const duration = performance.now() - start;
    requestCounter.add(
      1, {
      method: c.req.method,
      route: c.req.routePath,
      status: c.res.status.toString(),
    }
    )
    responseTimeHistogram.record(duration, {
    method: c.req.method,
    route: c.req.path,
  })
  }

