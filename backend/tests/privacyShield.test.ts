// Privacy Shield (PII Redaction) Unit Tests
import { redactPII, containsPII } from '../src/services/privacyShield';

describe('Privacy Shield — PII Redaction', () => {
  it('detects and redacts Saudi national ID (10-digit starting with 1 or 2)', () => {
    const result = redactPII('The user ID is 1234567890 and lives in Riyadh.');
    expect(result.redactionCount).toBeGreaterThanOrEqual(1);
    expect(result.redactedText).toContain('[SAUDI_ID_REDACTED]');
    expect(result.redactedText).not.toContain('1234567890');
  });

  it('detects and redacts Saudi phone number (+966 format)', () => {
    const result = redactPII('Call me at +966512345678 tomorrow.');
    expect(result.redactionCount).toBeGreaterThanOrEqual(1);
    expect(result.redactedText).toContain('[SAUDI_PHONE_REDACTED]');
    expect(result.redactedText).not.toContain('+966512345678');
  });

  it('detects and redacts email addresses', () => {
    const result = redactPII('Send report to ahmed@example.com please.');
    expect(result.redactionCount).toBeGreaterThanOrEqual(1);
    expect(result.redactedText).toContain('[EMAIL_REDACTED]');
    expect(result.redactedText).not.toContain('ahmed@example.com');
  });

  it('returns zero redactions for clean text', () => {
    const result = redactPII('Hello world, this is a safe sentence with no PII.');
    expect(result.redactionCount).toBe(0);
    expect(result.redactedText).toBe('Hello world, this is a safe sentence with no PII.');
  });

  it('redaction count matches number of detected items', () => {
    const text = 'User 1234567890, email test@test.com, phone +966512345678';
    const result = redactPII(text);
    expect(result.redactionCount).toBe(result.redactedItems.length);
  });

  it('generates consistent SHA-256 hash for the same input', () => {
    const text = 'consistent input';
    const r1 = redactPII(text);
    const r2 = redactPII(text);
    expect(r1.originalHash).toBe(r2.originalHash);
  });

  it('containsPII returns true when PII is present', () => {
    expect(containsPII('My ID is 1234567890')).toBe(true);
  });

  it('containsPII returns false when no PII present', () => {
    expect(containsPII('This is safe text only')).toBe(false);
  });

  it('detects Saudi IBAN format', () => {
    const result = redactPII('Transfer to IBAN SA0380000000608010167519');
    expect(result.redactionCount).toBeGreaterThanOrEqual(1);
    expect(result.redactedText).toContain('[IBAN_REDACTED]');
  });

  it('handles multiple PII types in one text', () => {
    const result = redactPII('ID: 1234567890, Email: u@u.com, Phone: +966512345678');
    expect(result.redactionCount).toBeGreaterThanOrEqual(3);
  });
});
