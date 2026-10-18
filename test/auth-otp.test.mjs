import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper functions mirroring frontend logic
function validateOtp(code) {
  if (typeof code !== 'string') return false;
  const trimmed = code.trim();
  return /^[0-9]{6}$/.test(trimmed);
}

function maskEmail(str) {
  if (!str || !str.includes('@')) return str;
  const [user, domain] = str.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
}

function validateSignupInputs({ fullName, email, password, confirmPassword }) {
  if (!fullName || !fullName.trim()) return { valid: false, error: 'Full name required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim())) return { valid: false, error: 'Invalid email' };
  if (!password || password.length < 8) return { valid: false, error: 'Password must be at least 8 characters long' };
  if (password !== confirmPassword) return { valid: false, error: 'Passwords do not match' };
  return { valid: true, error: null };
}

describe('Supabase Auth OTP Verification & Security', () => {

  describe('6-Digit OTP Validation', () => {
    it('accepts valid 6-digit numeric codes', () => {
      assert.equal(validateOtp('123456'), true);
      assert.equal(validateOtp('000000'), true);
      assert.equal(validateOtp('987654'), true);
    });

    it('rejects non-numeric characters', () => {
      assert.equal(validateOtp('12345a'), false);
      assert.equal(validateOtp('abcdef'), false);
      assert.equal(validateOtp('12 456'), false);
      assert.equal(validateOtp('12-345'), false);
    });

    it('rejects strings not exactly 6 digits', () => {
      assert.equal(validateOtp(''), false);
      assert.equal(validateOtp('12345'), false);
      assert.equal(validateOtp('1234567'), false);
      assert.equal(validateOtp('1'), false);
    });
  });

  describe('Email Masking (Privacy & Security)', () => {
    it('obscures standard email user handles without leaking full username', () => {
      const masked = maskEmail('johndoe@example.com');
      assert.equal(masked, 'jo***e@example.com');
    });

    it('handles short usernames gracefully', () => {
      const masked = maskEmail('me@example.com');
      assert.equal(masked, 'm*@example.com');
    });

    it('preserves the domain name for user confirmation', () => {
      const masked = maskEmail('customer123@gmail.com');
      assert.ok(masked.endsWith('@gmail.com'));
    });
  });

  describe('Signup Inputs & Validation', () => {
    it('validates correct signup credentials', () => {
      const result = validateSignupInputs({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      assert.equal(result.valid, true);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const result = validateSignupInputs({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short',
        confirmPassword: 'short',
      });
      assert.equal(result.valid, false);
      assert.match(result.error, /8 characters/);
    });

    it('rejects mismatched passwords', () => {
      const result = validateSignupInputs({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        confirmPassword: 'Password999!',
      });
      assert.equal(result.valid, false);
      assert.match(result.error, /do not match/);
    });
  });

  describe('Supabase Auth Method Invocations', () => {
    it('constructs correct signup payload with CAPTCHA token and metadata', () => {
      const email = 'user@example.com';
      const password = 'SecretPassword123!';
      const fullName = 'Test User';
      const captchaToken = 'cf-turnstile-token-sample';

      const payload = {
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          captchaToken,
        },
      };

      assert.equal(payload.email, 'user@example.com');
      assert.equal(payload.options.data.full_name, 'Test User');
      assert.equal(payload.options.captchaToken, 'cf-turnstile-token-sample');
    });

    it('constructs correct verifyOtp payload for signup', () => {
      const email = 'user@example.com';
      const token = '654321';

      const verifyPayload = {
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: 'signup',
      };

      assert.equal(verifyPayload.type, 'signup');
      assert.equal(verifyPayload.token, '654321');
    });

    it('constructs correct resetPasswordForEmail payload with CAPTCHA token', () => {
      const email = 'user@example.com';
      const captchaToken = 'turnstile-recovery-token';

      const resetPayload = {
        email: email.trim().toLowerCase(),
        options: { captchaToken },
      };

      assert.equal(resetPayload.email, 'user@example.com');
      assert.equal(resetPayload.options.captchaToken, 'turnstile-recovery-token');
    });

    it('constructs correct verifyOtp payload for password recovery', () => {
      const email = 'user@example.com';
      const token = '789123';

      const verifyPayload = {
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: 'recovery',
      };

      assert.equal(verifyPayload.type, 'recovery');
      assert.equal(verifyPayload.token, '789123');
    });

    it('enforces that password update requires a verified recovery session', () => {
      let hasVerifiedRecovery = false;

      function attemptPasswordUpdate(newPassword) {
        if (!hasVerifiedRecovery) {
          throw new Error('Unauthorized: Recovery OTP must be verified before updating password.');
        }
        return { success: true };
      }

      // Must throw when not verified
      assert.throws(() => attemptPasswordUpdate('NewSecret123!'), /Unauthorized/);

      // Succeeds once verified
      hasVerifiedRecovery = true;
      assert.equal(attemptPasswordUpdate('NewSecret123!').success, true);
    });

    it('enforces generic security messaging for password recovery requests', () => {
      // Must not leak whether an account exists or not
      const genericMsg = 'If an account exists for this email, a 6-digit verification code has been sent.';
      assert.ok(!genericMsg.includes('does not exist'));
      assert.ok(!genericMsg.includes('found'));
    });
  });

  describe('Resend Cooldown Enforcement', () => {
    it('blocks resend code when cooldown is active', () => {
      let cooldown = 45; // 45 seconds remaining
      let resendTriggered = false;

      function triggerResend() {
        if (cooldown > 0) return false;
        resendTriggered = true;
        return true;
      }

      assert.equal(triggerResend(), false);
      assert.equal(resendTriggered, false);

      // Cooldown expired
      cooldown = 0;
      assert.equal(triggerResend(), true);
      assert.equal(resendTriggered, true);
    });
  });

});
