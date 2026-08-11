/**
 * EmailService
 *
 * Provides a structured email-sending abstraction. In production this would
 * integrate with a provider like SendGrid, Resend, or AWS SES. For now it
 * uses a "simulated" transport that logs the outbound message so the rest of
 * the system can call it without needing an SMTP server in development.
 *
 * Architectural note: The service is designed against an interface so that
 * the concrete transport can be swapped (e.g. nodemailer ↔ Resend) without
 * touching callers.
 */
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  attachments?: Array<{ filename: string; content: Buffer | string }>;
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  provider: string;
  simulatedAt?: string;
}

export interface IEmailTransport {
  send(options: EmailOptions): Promise<EmailResult>;
}

// ── Simulated transport (safe default for dev / CI) ──────────────────────────

class SimulatedTransport implements IEmailTransport {
  async send(options: EmailOptions): Promise<EmailResult> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    logger.info('📧 [EmailService] Simulated email sent', {
      to: recipients,
      subject: options.subject,
      provider: 'simulated',
    });

    return {
      messageId: `sim-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      accepted: recipients,
      rejected: [],
      provider: 'simulated',
      simulatedAt: new Date().toISOString(),
    };
  }
}

// ── EmailService ─────────────────────────────────────────────────────────────

export class EmailService {
  private readonly transport: IEmailTransport;
  private readonly defaultFrom: string;

  constructor(
    transport: IEmailTransport = new SimulatedTransport(),
    defaultFrom = 'FlowForge <noreply@flowforge.io>',
  ) {
    this.transport = transport;
    this.defaultFrom = defaultFrom;
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    const merged: EmailOptions = {
      from: this.defaultFrom,
      ...options,
    };

    try {
      const result = await this.transport.send(merged);
      logger.info('Email dispatched', {
        messageId: result.messageId,
        to: merged.to,
        subject: merged.subject,
        provider: result.provider,
      });
      return result;
    } catch (err) {
      logger.error('Email dispatch failed', {
        to: merged.to,
        subject: merged.subject,
        error: (err as Error).message,
      });
      throw err;
    }
  }

  // ── Template helpers ───────────────────────────────────────────────────────

  async sendWelcome(email: string, name: string): Promise<EmailResult> {
    return this.send({
      to: email,
      subject: 'Welcome to FlowForge 🚀',
      html: `<h1>Hi ${name},</h1><p>Welcome to FlowForge – the enterprise workflow automation platform. Your account is ready.</p>`,
      text: `Hi ${name}, welcome to FlowForge. Your account is ready.`,
    });
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<EmailResult> {
    const resetUrl = `${process.env['APP_URL'] ?? 'http://localhost:5173'}/auth/reset-password?token=${resetToken}`;
    return this.send({
      to: email,
      subject: 'FlowForge – Reset your password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      text: `Reset your password: ${resetUrl} (expires in 1 hour)`,
    });
  }

  async sendExecutionAlert(
    email: string,
    opts: {
      workflowName: string;
      executionId: string;
      status: 'COMPLETED' | 'FAILED';
      durationMs?: number;
      error?: string;
    },
  ): Promise<EmailResult> {
    const emoji = opts.status === 'COMPLETED' ? '✅' : '❌';
    return this.send({
      to: email,
      subject: `${emoji} Workflow "${opts.workflowName}" ${opts.status.toLowerCase()}`,
      html: `
        <h2>${emoji} Workflow Execution ${opts.status}</h2>
        <p><strong>Workflow:</strong> ${opts.workflowName}</p>
        <p><strong>Execution ID:</strong> ${opts.executionId}</p>
        ${opts.durationMs !== undefined ? `<p><strong>Duration:</strong> ${(opts.durationMs / 1000).toFixed(2)}s</p>` : ''}
        ${opts.error ? `<p><strong>Error:</strong> ${opts.error}</p>` : ''}
      `,
      text: `Workflow "${opts.workflowName}" ${opts.status}. Execution: ${opts.executionId}.${opts.error ? ` Error: ${opts.error}` : ''}`,
    });
  }
}

export const emailService = new EmailService();
