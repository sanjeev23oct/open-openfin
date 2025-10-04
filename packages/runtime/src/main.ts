import { RuntimeCore } from './RuntimeCore';
import { RuntimeConfig } from '@desktop-interop/sdk';

/**
 * Main entry point for the runtime process
 */
async function main() {
  // Parse command line arguments
  const args = parseArgs(process.argv.slice(2));
  
  // Build runtime configuration
  const config: RuntimeConfig = {
    version: args.version || '0.1.0',
    port: args.port ? parseInt(args.port) : 9000,
    logLevel: (args.logLevel as any) || 'info',
    autoUpdate: false,
    crashReporting: false
  };
  
  // Create and initialize runtime
  const runtime = new RuntimeCore();
  
  try {
    await runtime.initialize(config);
    
    // Handle shutdown signals
    process.on('SIGTERM', async () => {
      await runtime.shutdown();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      await runtime.shutdown();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to initialize runtime:', error);
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].substring(2);
      const value = argv[i + 1];
      args[key] = value;
      i++;
    }
  }
  
  return args;
}

// Start the runtime
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
