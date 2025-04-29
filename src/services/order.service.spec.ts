import { OrderService } from './order.service';
import { OrderInputDto } from '../typings/dtos/order-input.dto';

describe('OrderService', () => {
    let service: OrderService;
    const mockOrderInput: OrderInputDto = {
        publicKey: 'pk_test_abc123',
        cardTransactionMode: 'authAndCapture',
        backUrl: 'https://example.com',
        customer: {
            identifier: 'test-customer',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
        },
        order: {
            orderId: 'test-order-123',
            type: 'purchase',
            amount: 100,
            currency: 'EUR',
            description: 'Test order',
        },
    };

    beforeEach(() => {
        service = new OrderService('test-secret-key');
    });

    afterEach(() => {
    });

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

    describe('createOrder', () => {
        it('should successfully create order with valid test environment and public key', () => {
            const result = service.createOrder(mockOrderInput);

            expect(result).toHaveProperty('payload');
            expect(result).toHaveProperty('checksum');
            expect(typeof result.payload).toBe('string');
            expect(typeof result.checksum).toBe('string');
        });

        it('should successfully create order with valid live environment and public key', () => {
            const liveOrderInput = {
                ...mockOrderInput,
                publicKey: 'pk_live_xyz789',
            };
            const result = service.createOrder(liveOrderInput);

            expect(result).toHaveProperty('payload');
            expect(result).toHaveProperty('checksum');
            expect(typeof result.payload).toBe('string');
            expect(typeof result.checksum).toBe('string');
        });

        it('should throw error when public key format is invalid', () => {
            const invalidOrderInput = {
                ...mockOrderInput,
                publicKey: 'invalid_key_format',
            };

            expect(() => {
                service.createOrder(invalidOrderInput);
            }).toThrow('Invalid public key format. Expected format: pk_<env>_key');
        });

        it('should set saveCard to false when not provided', () => {
            const orderInputWithoutSaveCard = { ...mockOrderInput };
            delete orderInputWithoutSaveCard.saveCard;

            const result = service.createOrder(orderInputWithoutSaveCard);

            expect(result).toHaveProperty('payload');
            expect(result).toHaveProperty('checksum');
            expect(typeof result.payload).toBe('string');
            expect(typeof result.checksum).toBe('string');
        });

        it('should preserve saveCard value when provided', () => {
            const orderInputWithSaveCard = {
                ...mockOrderInput,
                saveCard: true,
            };

            const result = service.createOrder(orderInputWithSaveCard);

            expect(result).toHaveProperty('payload');
            expect(result).toHaveProperty('checksum');
            expect(typeof result.payload).toBe('string');
            expect(typeof result.checksum).toBe('string');
        });
    });
});
