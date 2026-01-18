import { APIRequestContext } from '@playwright/test';

export class LifiApi {
  constructor(private request: APIRequestContext) { }

  async getQuote(params: Record<string, any>) {
    return await this.request.get('quote', { params });
  }

  async getTools(chains?: string | number) {
    return await this.request.get('tools', {
      params: chains ? { chains } : {},
    });
  }

  async getToken(chain: string, symbol: string) {
    const response = await this.request.get('token', {
      params: { chain, token: symbol }
    });
    return await response.json();
  }

  /**
     * POST /v1/advanced/routes
     * Fetches complex multi-step routes based on advanced parameters.
     */
  async getAdvancedRoutes(payload: object) {
    return await this.request.post('advanced/routes', {
      data: payload,
      headers: { 'Content-Type': 'application/json' }
    });
  }

}