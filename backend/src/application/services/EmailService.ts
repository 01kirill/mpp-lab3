export interface EmailService {
  sendPasswordReset(to: string, resetLink: string): Promise<void>;
}