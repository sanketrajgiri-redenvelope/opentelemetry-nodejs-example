// logger.js
import pino from "pino";
import { trace } from "@opentelemetry/api";

const logger = pino({
  transport: {
    targets: [
      {
        target: "pino-opentelemetry-transport",
        options: {
          resourceAttributes: {
            "service.name": "order-service",
          },
        },
      },
      {
        target: "pino-pretty",
        level: "info",
        options: { colorize: true },
      },
    ],
  },
formatters: {
    log(object) {
      const span = trace.getActiveSpan()
      if (span) {
        const spanContext = span.spanContext()
        return {
          ...object,
          "dd.trace_id": spanContext.traceId,
          "dd.span_id": spanContext.spanId,
        }
      }
      return object
    },
  },
});

export default logger;
