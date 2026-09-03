/**
 * Structured audit logger for security-critical events.
 * 
 * In production, replace console transport with a proper
 * logging service (e.g., ELK, Datadog, CloudWatch).
 */

export function auditLog(event, details = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        event,
        ...details,
    };

    // Structured JSON log — easily parseable by log aggregators
    console.log(`[AUDIT] ${JSON.stringify(entry)}`);
}

// Pre-defined event helpers
export const AuditEvents = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    SIGNUP: 'SIGNUP',
    USER_APPROVED: 'USER_APPROVED',
    USER_REJECTED: 'USER_REJECTED',
    USER_DELETED: 'USER_DELETED',
    MODEL_CHANGED: 'MODEL_CHANGED',
    FEATURE_TOGGLED: 'FEATURE_TOGGLED',
    RECORD_CREATED: 'RECORD_CREATED',
    RECORD_DELETED: 'RECORD_DELETED',
    ADMIN_ACTION: 'ADMIN_ACTION',
    RATE_LIMIT_HIT: 'RATE_LIMIT_HIT',
    SUSPICIOUS_UPLOAD: 'SUSPICIOUS_UPLOAD',
};
