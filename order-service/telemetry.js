import * as opentelemetry from '@opentelemetry/sdk-node';
import { diag, DiagConsoleLogger, DiagLogLevel,trace,SpanStatusCode } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { AggregationType, InstrumentType } from '@opentelemetry/sdk-metrics';


diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const sdk = new opentelemetry.NodeSDK({
  spanProcessors: [
    new opentelemetry.tracing.BatchSpanProcessor(new OTLPTraceExporter({
      url: (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318') + '/v1/traces',
    })),
  ],
  metricReader: new opentelemetry.metrics.PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318') + '/v1/metrics',
    }),
    // exporter: new opentelemetry.metrics.ConsoleMetricExporter(),
    exportIntervalMillis: 60000, // Export metrics every 60 seconds
  }),
  // views: [
  //   {
  //     instrumentName: "http_request_latency_ms",
  //     instrumentType: InstrumentType.HISTOGRAM,
  //     aggregation: AggregationType.DEFAULT
  //   },
  //   {
  //     instrumentName: "http_request_count",
  //     instrumentType: InstrumentType.COUNTER,
  //     aggregation: AggregationType.DEFAULT
  //   },
  //   {
  //     instrumentName: "*",
  //     aggregation: AggregationType.DROP
  //   },
  // ],
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-undici': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-net': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-dns': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-mongoose': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-mongodb': {
        enabled: false,
      },
    }
    ),
    // new HttpInstrumentation(),
  ],
});

async function initTracing() {
  try {
    await sdk.start()
    console.log('✅ OpenTelemetry SDK started')
  } catch (err) {
    console.error('❌ Error starting OpenTelemetry SDK', err)
  }

  process.on('SIGTERM', async () => {
    try {
      await sdk.shutdown()
      console.log('🛑 OpenTelemetry SDK shut down')
    } catch (err) {
      console.error('❌ Error shutting down OpenTelemetry SDK', err)
    }
  })
}


initTracing()

export function withSpan(handler) {
  return async (c, next) => {
    const tracer = trace.getTracer('hono-handler');
    const spanName = handler.name || 'anonymous-handler';
    return tracer.startActiveSpan(spanName, async (span) => {
      try {
        const result = await handler(c, next);
        span.setStatus({ code: SpanStatusCode.OK }); // 1 = OK
        return result;
      }
      catch (err) {
        span.recordException(err);
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        throw err;
      }
      finally {
        span.end();
      }
    });
  };
}

