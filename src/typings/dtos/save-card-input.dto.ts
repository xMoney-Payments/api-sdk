export class SaveCardInputDto {
  publicKey: string;
  invoiceEmail?: string;
  backUrl: string;
  customer: {
    identifier: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    city?: string;
    phone?: string;
    email?: string;
    tags?: string[];
  };
  order: {
    orderId: string;
    description: string;
  };
  customData?: string;
}
