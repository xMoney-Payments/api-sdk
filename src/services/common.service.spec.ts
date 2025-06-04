import { CommonService } from './common.service';

describe('CommonService', () => {
  let service: CommonService;

  beforeEach(() => {
    service = new CommonService({ secretKey: 'test-secret-key' });
  });

  afterEach(() => {});

  describe('extractKeyFromSecretKey', () => {
    it('should extract key from valid test secret key', () => {
      const secretKey = 'sk_test_abc123';
      const result = (service as any).extractKeyFromSecretKey(secretKey);
      expect(result).toBe('abc123');
    });

    it('should extract key from valid live secret key', () => {
      const secretKey = 'sk_live_xyz789';
      const result = (service as any).extractKeyFromSecretKey(secretKey);
      expect(result).toBe('xyz789');
    });

    it('should extract key from valid simple secret key', () => {
      const secretKey = 'xyz789';
      const result = (service as any).extractKeyFromSecretKey(secretKey);
      expect(result).toBe('xyz789');
    });

    it('should return original key for invalid secret key format', () => {
      const secretKey = 'invalid_key_format';
      const result = (service as any).extractKeyFromSecretKey(secretKey);
      expect(result).toBe(secretKey);
    });

    it('should return original key for secret key with wrong prefix', () => {
      const secretKey = 'wrong_prefix_test_abc123';
      const result = (service as any).extractKeyFromSecretKey(secretKey);
      expect(result).toBe(secretKey);
    });

    it('should return original key for secret key with wrong environment', () => {
      const secretKey = 'sk_staging_abc123';
      const result = (service as any).extractKeyFromSecretKey(secretKey);
      expect(result).toBe(secretKey);
    });
  });

  describe('extractKeyFromPublicKey', () => {
    it('should extract key from valid test public key', () => {
      const publicKey = 'pk_test_abc123';
      const result = (service as any).extractKeyFromPublicKey(publicKey);
      expect(result).toBe('abc123');
    });

    it('should extract key from valid live public key', () => {
      const publicKey = 'pk_live_xyz789';
      const result = (service as any).extractKeyFromPublicKey(publicKey);
      expect(result).toBe('xyz789');
    });

    it('should return null for invalid public key format', () => {
      const publicKey = 'invalid_key_format';
      const result = (service as any).extractKeyFromPublicKey(publicKey);
      expect(result).toBeNull();
    });

    it('should return null for public key with wrong prefix', () => {
      const publicKey = 'wrong_prefix_test_abc123';
      const result = (service as any).extractKeyFromPublicKey(publicKey);
      expect(result).toBeNull();
    });

    it('should return null for public key with wrong environment', () => {
      const publicKey = 'pk_staging_abc123';
      const result = (service as any).extractKeyFromPublicKey(publicKey);
      expect(result).toBeNull();
    });
  });
});
