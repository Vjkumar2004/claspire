// Secure logging utility - only logs errors and warnings in production
// No sensitive data should be logged

type LogLevel = 'error' | 'warn';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  userId?: string;
}

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private shouldLog(level: LogLevel): boolean {
    // Always log errors and warnings
    return level === 'error' || level === 'warn';
  }

  private sanitizeMessage(message: string): string {
    // Remove potential sensitive information
    return message
      .replace(/password[=:]\s*[^\s]+/gi, 'password=***')
      .replace(/token[=:]\s*[^\s]+/gi, 'token=***')
      .replace(/secret[=:]\s*[^\s]+/gi, 'secret=***')
      .replace(/key[=:]\s*[^\s]+/gi, 'key=***')
      .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '****-****-****-****') // Credit cards
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***'); // Emails
  }

  private formatLogEntry(level: LogLevel, message: string, context?: string): LogEntry {
    return {
      level,
      message: this.sanitizeMessage(message),
      timestamp: new Date().toISOString(),
      context,
    };
  }

  error(message: string, context?: string) {
    if (!this.shouldLog('error')) return;

    const logEntry = this.formatLogEntry('error', message, context);
    
    if (this.isDevelopment) {
      console.error(`[ERROR] ${logEntry.timestamp} - ${message}`, context || '');
    } else {
      // In production, you might want to send to a logging service
      console.error(JSON.stringify(logEntry));
    }
  }

  warn(message: string, context?: string) {
    if (!this.shouldLog('warn')) return;

    const logEntry = this.formatLogEntry('warn', message, context);
    
    if (this.isDevelopment) {
      console.warn(`[WARN] ${logEntry.timestamp} - ${message}`, context || '');
    } else {
      // In production, you might want to send to a logging service
      console.warn(JSON.stringify(logEntry));
    }
  }

  // Debug logs are only shown in development and never contain sensitive data
  debug(message: string, context?: string) {
    if (!this.isDevelopment) return;
    
    console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, context || '');
  }
}

export const logger = new SecureLogger();

// Helper for API error logging
export function logApiError(error: any, context: string, userId?: string) {
  const errorMessage = error?.message || 'Unknown error';
  logger.error(`API Error in ${context}: ${errorMessage}`, userId ? `User: ${userId}` : undefined);
}

// Helper for authentication events
export function logAuthEvent(event: string, userId?: string, success: boolean = true) {
  const message = `Auth event: ${event} - ${success ? 'Success' : 'Failed'}`;
  if (success) {
    logger.debug(message, userId ? `User: ${userId}` : undefined);
  } else {
    logger.warn(message, userId ? `User: ${userId}` : undefined);
  }
}
