type LogMetadata = Record<string, unknown>;
type LogLevel = 'error' | 'info' | 'warn';

class Logger {
  public info(message: string, metadata?: LogMetadata): void {
    this.write('info', message, metadata);
  }

  public warn(message: string, metadata?: LogMetadata): void {
    this.write('warn', message, metadata);
  }

  public error(message: string, metadata?: LogMetadata): void {
    this.write('error', message, metadata);
  }

  private write(level: LogLevel, message: string, metadata?: LogMetadata): void {
    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(metadata ? { metadata } : {}),
    };

    const output = JSON.stringify(entry);

    if (level === 'error') {
      console.error(output);
      return;
    }

    if (level === 'warn') {
      console.warn(output);
      return;
    }

    console.info(output);
  }
}

export const logger = new Logger();

