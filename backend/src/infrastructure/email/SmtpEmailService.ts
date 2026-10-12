import { createTransport, Transporter } from 'nodemailer';
import { EmailService } from '../../application/services/EmailService';
import { ILogger } from '../logging/logger';
import { env } from '../../config/env';

export class SmtpEmailService implements EmailService {
  private transporter: Transporter;

  constructor(private logger: ILogger) {
    this.transporter = createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: false,
      ignoreTLS: true,
    });
  }

  async sendPasswordReset(to: string, resetLink: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #4285f4; margin: 0 0 16px;">Восстановление пароля</h2>
        <p style="color: #333; line-height: 1.5;">
          Вы запросили восстановление пароля для аккаунта <b>${to}</b>.
        </p>
        <p style="color: #333; line-height: 1.5;">
          Ссылка действительна в течение <b>1 часа</b>. Если вы не запрашивали сброс — просто проигнорируйте это письмо.
        </p>
        <p style="margin: 24px 0;">
          <a href="${resetLink}"
             style="display: inline-block; padding: 12px 24px; background: #4285f4; color: #fff;
                    text-decoration: none; border-radius: 6px; font-weight: 600;">
            Сбросить пароль
          </a>
        </p>
        <p style="color: #999; font-size: 12px; word-break: break-all;">
          Если кнопка не работает, скопируйте ссылку: ${resetLink}
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: env.smtpFrom,
        to,
        subject: 'Восстановление пароля — Calendar',
        html,
        text: `Восстановление пароля: ${resetLink}`,
      });
      this.logger.info('email.password_reset.sent', { to });
    } catch (e) {
      this.logger.error('email.password_reset.failed', {
        to,
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  }
}