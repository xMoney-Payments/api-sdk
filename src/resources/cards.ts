import type { ApiResponse, XMoneyCore } from '../types'
import { PaginatedList, XMoneyError } from '../core'

/**
 * Saved card information
 */
export interface Card {
  /**
   * Card ID
   */
  id: number
  /**
   * Customer ID who owns the card
   */
  customerId: number
  /**
   * Card type (visa, mastercard, etc.)
   */
  type: string
  /**
   * Masked card number
   */
  cardNumber: string
  /**
   * Expiry month (MM)
   */
  expiryMonth: string
  /**
   * Expiry year (YYYY)
   */
  expiryYear: string
  /**
   * Name on card
   */
  nameOnCard?: string
  /**
   * Cardholder country (ISO 3166-1 alpha-2)
   */
  cardHolderCountry?: string
  /**
   * Cardholder state
   */
  cardHolderState?: string
  /**
   * Card payment provider
   */
  cardProvider: string
  /**
   * Whether card has a token for processing
   */
  hasToken?: boolean
  /**
   * Card status (active, deleted, etc.)
   */
  cardStatus: string
  /**
   * Bank identification number information
   */
  binInfo?: BinInfo
}

/**
 * Bank Identification Number (BIN) information
 */
export interface BinInfo {
  /**
   * First 6 digits of card number
   */
  bin: string
  /**
   * Card brand (Visa, Mastercard, etc.)
   */
  brand?: string
  /**
   * Card type (debit, credit, prepaid)
   */
  type?: string
  /**
   * Card level (classic, gold, platinum, etc.)
   */
  level?: string
  /**
   * Issuing country code
   */
  countryCode?: string
  /**
   * Issuing bank name
   */
  bank?: string
}

/**
 * Parameters for listing saved cards
 */
export interface CardListParams {
  /**
   * Search ID from previous search
   */
  searchId?: string
  /**
   * Filter by customer ID
   */
  customerId?: number
  /**
   * Filter by order ID
   */
  orderId?: number
  /**
   * Filter by token availability
   */
  hasToken?: 'yes' | 'no'
  /**
   * Filter by card status
   * - all: Include all cards
   * - deleted: Only deleted cards
   */
  cardStatus?: 'all' | 'deleted'
  /**
   * Page number
   */
  page?: number
  /**
   * Items per page
   */
  perPage?: number
  /**
   * Reverse sort order
   */
  reverseSorting?: 0 | 1
}

/**
 * Resource for managing saved payment cards
 *
 * Note: Secure token required for card operations
 *
 * @example
 * ```typescript
 * const xMoney = createXMoneyClient({
 *   apiKey: 'your-api-key',
 *   secureToken: 'your-secure-token'
 * })
 *
 * // Retrieve a saved card
 * const card = await xMoney.cards.retrieve(cardId, customerId)
 * console.log(card.cardNumber) // 411111******1111
 * ```
 */
export class CardsResource {
  constructor(private client: XMoneyCore) {}

  /**
   * Retrieve a saved card
   * @param id - Card ID
   * @param customerId - Customer ID (required for security)
   * @returns Card information
   * @throws {XMoneyError} If card not found
   */
  async retrieve(id: number, customerId: number): Promise<Card> {
    const response = await this.client.request<Card>({
      method: 'GET',
      path: `/card/${id}`,
      query: { customerId },
    })

    if (!response.data) {
      throw new XMoneyError('Card not found')
    }

    return response.data
  }

  /**
   * Delete a saved card
   * @param id - Card ID
   * @throws {XMoneyError} If deletion fails
   */
  async delete(id: number): Promise<void> {
    await this.client.request({
      method: 'DELETE',
      path: `/card/${id}`,
    })
  }

  /**
   * List saved cards with filtering
   * @param params - List parameters
   * @returns Paginated list of cards
   *
   * @example
   * ```typescript
   * // List all active cards for a customer
   * const cards = await xMoney.cards.list({
   *   customerId: 123,
   *   hasToken: 'yes'
   * })
   *
   * for await (const card of cards) {
   *   console.log(card.type, card.expiryMonth + '/' + card.expiryYear)
   * }
   * ```
   */
  async list(params?: CardListParams): Promise<PaginatedList<Card>> {
    const response = await this.client.request<Card[]>({
      method: 'GET',
      path: '/card',
      query: params,
    })

    // Create a fetch function for pagination
    const fetchNextPage = async (page: number): Promise<ApiResponse<Card[]>> => {
      return this.client.request<Card[]>({
        method: 'GET',
        path: '/card',
        query: { ...params, page },
      })
    }

    return new PaginatedList(
      response.data || [],
      response.pagination,
      response.searchParams,
      fetchNextPage,
    )
  }
}
