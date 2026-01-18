import { test, expect } from '@playwright/test';
import { LifiApi } from '../../utils/api-helpers';
import { ADDRESS, BRIDGES, CHAINS, TOKENS } from '../../utils/constants';

test.describe('LI.FI Advanced Routes API - POST /v1/advanced/routes', () => {
  let lifi: LifiApi;

  test.beforeEach(async ({ request }) => {
    lifi = new LifiApi(request);
  });

  /**
   * TEST: Functional Cross-Chain Route - FASTEST order
   * INTENT: Verify the API returns multiple routing options for a standard bridge.
   * LOGIC: Request USDC (Arbitrum) to USDT (Mainnet).
   */
  test('Functional: Retrieve multiple route options for cross-chain transfer', async () => {
    const response = await lifi.getAdvancedRoutes({
      fromChainId: CHAINS.ARBITRUM,
      toChainId: CHAINS.ETH,
      fromTokenAddress: TOKENS.USDC_ARBITRUM,
      toTokenAddress: TOKENS.USDT_ETH,
      fromAmount: '10000000', // 10 USDC
      fromAddress: ADDRESS.FROM_ADDRESS,
      options: { order: 'FASTEST' }
    });

    const body = await response.json();
    expect(response.status()).toBe(200);
    expect(body.routes.length).toBeGreaterThan(0);

    // Verify the first route is indeed the requested token
    expect(body.routes[0].fromToken.symbol).toBe('USDC');
    expect(body.routes[0].toToken.symbol).toBe('USDT');
  });

  /**
   * TEST: Functional Cross-Chain Route - CHEAPEST order
   * INTENT: Verify the sorting logic when 'CHEAPEST' is requested.
   * RISK: Incorrect sorting leads to poor user UX on Jumper.
   */
  test('Functional: Verify routes are sorted by CHEAPEST', async () => {
    const response = await lifi.getAdvancedRoutes({
      fromChainId: CHAINS.POLYGON,
      toChainId: CHAINS.BASE,
      fromTokenAddress: TOKENS.USDC_POLYGON,
      toTokenAddress: TOKENS.USDC_BASE,
      fromAmount: '50000000',
      fromAddress: ADDRESS.FROM_ADDRESS,
      options: { order: 'CHEAPEST' }
    });

    const body = await response.json();
    const routes = body.routes;

    // Check if the first route has a higher or equal toAmount than the second
    if (routes.length > 1) {
      const firstAmount = BigInt(routes[0].toAmount);
      const secondAmount = BigInt(routes[1].toAmount);
      expect(firstAmount >= secondAmount).toBeTruthy();
    }
  });

  /**
   * TEST: Bridge Filtering
   * INTENT: Test routes with filters enabled.
   */
  test('Functional: Verify advanced routes respect bridge filtering', async () => {
    const payload = {
      fromChainId: CHAINS.ARBITRUM,
      toChainId: CHAINS.ETH,
      fromTokenAddress: TOKENS.USDC_ARBITRUM,
      toTokenAddress: TOKENS.USDC_ETH,
      fromAmount: '10000000', // 10 USDC
      options: {
        bridges: { allow: [BRIDGES.ACROSS, BRIDGES.STARGATE] }
      }
    };

    const response = await lifi.getAdvancedRoutes(payload);
    const body = await response.json();
    expect(response.status()).toBe(200);

    // Helper: Checks if any step in a route uses a forbidden tool
    const routeUsesAllowedBridges = (route: any, allowed: string[]) =>
      route.steps.every((step: any) =>
        step.type !== 'cross' || allowed.includes(step.tool)
      );

    // Validate that every route returned strictly follows the 'allow' list
    const allRoutesValid = body.routes.every((route: any) =>
      routeUsesAllowedBridges(route, [BRIDGES.ACROSS, BRIDGES.STARGATE])
    );

    expect(allRoutesValid).toBeTruthy();
  });

  /**
   * Test: Sorting Logic (FASTEST vs CHEAPEST)
   * INTENT: Ensure the API's sorting engine actually prioritizes the correct metric.
   */
  test('Functional: Verify FASTEST route optimization', async () => {
    const payload = {
      fromChainId: CHAINS.ETH,
      toChainId: CHAINS.POLYGON,
      fromTokenAddress: TOKENS.USDC_ETH,
      toTokenAddress: TOKENS.USDC_POLYGON,
      fromAmount: '1000000000', // 1000 USDC
      options: { order: 'FASTEST' }
    };

    const response = await lifi.getAdvancedRoutes(payload);
    const body = await response.json();
    expect(response.status()).toBe(200);

    // If multiple routes are returned, the first should have the lowest estimated duration
    if (body.routes.length > 1) {
      const firstDuration = body.routes[0].steps.reduce((acc: number, step: any) => acc + step.estimate.executionDuration, 0);
      const secondDuration = body.routes[1].steps.reduce((acc: number, step: any) => acc + step.estimate.executionDuration, 0);

      expect(firstDuration).toBeLessThanOrEqual(secondDuration);
    }
  });

  /**
   * TEST: Negative Scenario - Invalid Pair
   * INTENT: Ensure API returns a clean error for impossible routes.
   */
  test('Negative: Handle impossible route request', async () => {
    const response = await lifi.getAdvancedRoutes({
      fromChainId: 1, // Mainnet
      toChainId: 1,
      fromTokenAddress: TOKENS.ETH_MAINNET, // Native ETH
      toTokenAddress: TOKENS.FAKE_TOKEN, // Fake Token
      fromAmount: '1000000000000000000',
      fromAddress: ADDRESS.FROM_ADDRESS
    });

    const body = await response.json();
    // API returns 400 for Bad Request
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(body.message).toMatch(/invalid|deny list/i);
  });

  /**
   * Test: Slippage & Price Impact
   * INTENT: This is a critical "Safety" test. Ensure if a route has a massive price impact, API should either hide it or warn the user.
   */
  test('Security: Validate maxPriceImpact filter', async () => {
    const payload = {
      fromChainId: CHAINS.ETH,
      toChainId: CHAINS.ARBITRUM,
      fromTokenAddress: TOKENS.USDC_ETH,
      toTokenAddress: TOKENS.USDC_ARBITRUM,
      fromAmount: '1000000000',
      options: {
        maxPriceImpact: 0.05 // 5% limit
      }
    };

    const response = await lifi.getAdvancedRoutes(payload);
    const body = await response.json();

    // Ensure no returned route exceeds the 5% price impact threshold
    body.routes.forEach((route: any) => {
      const priceImpact = parseFloat(route.steps[0].estimate.priceImpact || "0");
      expect(priceImpact).toBeLessThan(0.05);
    });
  });

  /**
   * Test: LIFI Fixed Fee Presence
   * INTENT: Ensure that "LIFI Fixed Fee" is present in the route.
   */
  test('Business Logic: Assert LIFI Service Fee is present in the route', async ({ request }) => {
    const payload = {
      fromChainId: CHAINS.POLYGON, // Polygon
      toChainId: CHAINS.OPTIMISM,    // Optimism
      fromTokenAddress: TOKENS.USDC_POLYGON, // USDC
      toTokenAddress: TOKENS.USDC_OPTIMISM,   // USDC
      fromAmount: '50000000', // 50 USDC
      fromAddress: ADDRESS.FROM_ADDRESS
    };

    const response = await lifi.getAdvancedRoutes(payload);
    const body = await response.json();
    expect(response.status()).toBe(200);

    // Ensure we have routes to inspect
    expect(body.routes?.length, 'No routes returned from API').toBeGreaterThan(0);

    // Focus on the first step of the first route
    const firstStep = body.routes[0].steps[0];
    const fees = firstStep.estimate.feeCosts || [];

    /**
     * ASSERTION: Check for the LIFI Fixed fee.
     */
    const lifiFee = fees.find((f: any) =>
      f.name.includes('LIFI Fixed Fee')
    );

    expect(lifiFee, `LIFI Fixed Fee not found in fee list: ${fees.map((f: any) => f.name).join(', ')}`).toBeDefined();

    // Optional: Assert that the fee is correctly formatted
    expect(typeof lifiFee.amount).toBe('string');
    console.log(`Verified LIFI Fee: ${lifiFee.amount} ${lifiFee.token.symbol}`);
  });

  /**
   * Test: Verify Integrator Fees Configuration
   * INTENT: Ensure that "Integrator Fees" are shown for the registered integrator.
   */
  test('Negative: API should reject unauthorized fee collection (Error 1011)', async ({ request }) => {
    const payload = {
      fromChainId: CHAINS.POLYGON,
      toChainId: CHAINS.OPTIMISM,
      fromTokenAddress: TOKENS.USDC_POLYGON,
      toTokenAddress: TOKENS.USDC_OPTIMISM,
      fromAmount: '10000000',
      options: {
        integrator: 'test_partner', // within the length of 23 chars
        fee: 0.03 // Attempting to collect 3% without authorization
      }
    };

    const response = await lifi.getAdvancedRoutes(payload);
    const body = await response.json();

    // Assert that the API correctly blocks unauthorized fee requests
    expect(response.status()).toBe(400);
    expect(body.code).toBe(1011);
    expect(body.message).toContain('not configured for collecting fees');
  });

});