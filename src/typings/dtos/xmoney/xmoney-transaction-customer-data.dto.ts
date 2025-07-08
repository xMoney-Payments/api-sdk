export class xMoneyTransactionCustomerDataDto {
    id: number;
    siteId: number;
    identifier: string;
    firstName: string;
    lastName: string;
    country: string;
    state: string;
    city: string;
    zipCode: number;
    address: string;
    phone: string;
    email: string;
    creationDate: Date;
    creationTimestamp: number
}