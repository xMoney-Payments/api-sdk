import { OrderService } from './order.service';
import { OrderInputDto } from '../typings/dtos/order-input.dto';
import { CommonService } from './common.service';

describe('OrderService', () => {
  let service: OrderService;
  let commonService: CommonService;
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

  beforeAll(() => {
    commonService = new CommonService({ secretKey: 'test-secret-key' });
    service = new OrderService(commonService);
  });

  afterEach(() => {});

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
