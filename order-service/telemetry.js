import * as opentelemetry from '@opentelemetry/sdk-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const sdk = new opentelemetry.NodeSDK({
  spanProcessors: [
    new opentelemetry.tracing.BatchSpanProcessor(new OTLPTraceExporter({
      url: (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318') + '/v1/traces',
    })),
  ],
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
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

