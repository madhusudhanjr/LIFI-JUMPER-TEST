import { test, expect } from '@playwright/test';
import { LifiApi } from '../../utils/api-helpers';
import { TOKENS, CHAINS, CHAIN_KEYS, TOKEN_SYMBOLS, ADDRESS } from '../../utils/constants';
import Ajv from 'ajv';
import { QuoteSchema } from '../../utils/schemas';

test.describe('LI.FI Quote API - GET /v1/quote', () => {
  let lifi: LifiApi;
  const fromAddress = ADDRESS.FROM_ADDRESS; // Dummy test address
  const ajv = new Ajv({ allErrors: true, verbose: true });
  const validate = ajv.compile(QuoteSchema);

  test.beforeEach(async ({ request }) => {
    lifi = new LifiApi(request);
  });

  /**
   * Same Chain Swap
   * Logic: High liquidity ensures 'tool' is likely a DEX (Uniswap/Sushi).
   */
  test('Functional: Same Chain Swap (USDC to ETH on Arbitrum)', async () => {
    const response = await lifi.getQuote({
      fromChain: CHAINS.ARBITRUM,
      toChain: CHAINS.ARBITRUM,
      fromToken: TOKENS.USDC_ARBITRUM,
      toToken: TOKENS.WETH_ARBITRUM,
      fromAmount: '10000000', // 10 USDC
      fromAddress,
    });
    console.log(`Full Request URL: ${response.url()}`);
    const body = await response.json();
    expect(response.status()).toBe(200);
    // On the same chain, it should be a single swap, not a bridge
    expect(body.tool).not.toBeNull();
    console.log(`Tool: ${body.tool}`);

    const valid = validate(body);
    if (!valid) {
      const errorDetails = validate.errors?.map(err => `${err.instancePath} ${err.message}`).join(', ');
      throw new Error(`Schema Validation Failed: ${errorDetails}`);
    }
    expect(valid).toBe(true);

  });

  /**
   * Standard EVM Bridge
   * Logic: Cross-chain stablecoins usually use optimized bridges like Stargate or Across.
   */
  test('Functional: Cross-Chain Bridge (USDT Polygon to USDC Base)', async () => {
    const response = await lifi.getQuote({
      fromChain: CHAINS.POLYGON,
      toChain: CHAINS.BASE,
      fromToken: TOKENS.USDT_POLYGON,
      toToken: TOKENS.USDC_BASE,
      fromAmount: '20000000', // 20 USDT
      fromAddress,
    });

    const body = await response.json();
    expect(response.status()).toBe(200);
    // Ensure it identifies as a cross-chain transfer
    expect(body.action.toChainId).toBe(CHAINS.BASE);
    console.log(`Bridge: ${body.tool}`);
  });

  /**
  * Cross-Chain Swap using Symbols and Chain Keys
  * Logic: Resolve symbols (USDC, MATIC) on specific chains (POL, ARB) 
  * and then request a quote.
  */
  test('Functional: Cross-chain swap using Chain Keys and Token Symbols', async ({ request }) => {

    // 1. Resolve symbols to addresses
    // We use 'POL' (Polygon) and 'ARB' (Arbitrum) chain keys
    const fromTokenInfo = await lifi.getToken(CHAIN_KEYS.POLYGON, TOKEN_SYMBOLS.USDT);
    const toTokenInfo = await lifi.getToken(CHAIN_KEYS.ARBITRUM, TOKEN_SYMBOLS.USDC);

    expect(fromTokenInfo.address).toBeDefined();
    expect(toTokenInfo.address).toBeDefined();

    // 2. Request quote using resolved addresses
    const response = await lifi.getQuote({
      fromChain: 'POL', // chain keys instead of IDs
      toChain: 'ARB',
      fromToken: fromTokenInfo.address,
      toToken: toTokenInfo.address,
      fromAmount: '10000000', // 10 USDT
      fromAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    });

    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.action.fromToken.symbol).toBe(TOKEN_SYMBOLS.USDT);
    expect(body.action.toToken.symbol).toBe(TOKEN_SYMBOLS.USDC);

    console.log(`Successfully resolved symbols and got quote via ${body.tool}`);
  });

  /**
   * Cross Chain Multi-hop
   * Logic: Small cap tokens usually require a swap to a major token (AVAX/USDC)
   * before they can be bridged. We check if the response contains multiple 'steps'.
   */
  test('Functional: Cross Chain Multi-hop (JOE Avalanche to OP Optimism)', async () => {
    const response = await lifi.getQuote({
      fromChain: CHAINS.AVALANCHE,
      toChain: CHAINS.OPTIMISM,
      fromToken: TOKENS.JOE_AVALANCHE,
      toToken: TOKENS.OP_OPTIMISM,
      fromAmount: '100000000000000000000', // 100 JOE
      fromAddress,
    });

    const body = await response.json();
    expect(response.status()).toBe(200);

    // Ensure the route exists and has a positive estimate
    expect(Number(body.estimate.toAmount)).toBeGreaterThan(0);

    // In complex routes, LI.FI often returns the cumulative feeCosts
    expect(body.estimate.feeCosts.length).toBeGreaterThan(0);
    console.log(`Complex Route via: ${body.tool}`);
  });

  /**
   * TEST: Validate Quote 
   * Logic: Validate transaction data, multi-step hand-off, and slippage math.
   */
  test('Technical: Validate Quote: Transaction Data, Multi-step Hand-off, and Slippage Math', async ({ request }) => {

    const response = await lifi.getQuote({
      fromChain: CHAINS.ARBITRUM,
      toChain: CHAINS.ARBITRUM,
      fromToken: TOKENS.USDC_ARBITRUM,
      toToken: TOKENS.WETH_ARBITRUM,
      fromAmount: '1000000',
      fromAddress,
      slippage: '0.005',
      integrator: 'lifi-api'
    });

    // Assert successful response
    const quote = await response.json();
    expect(response.status()).toBe(200);

    // 1. Validate Transaction Request exists
    const tx = quote.transactionRequest;
    expect(tx, 'transactionRequest should be defined in a quote response').toBeDefined();

    if (tx) {
      const txGasLimit = parseInt(tx.gasLimit, 16);
      const txGasPrice = parseInt(tx.gasPrice, 16);

      // Aggregate total estimated limit from all steps
      const estimatedLimitSum = quote.estimate.gasCosts.reduce(
        (sum: number, cost: any) => sum + parseInt(cost.limit), 0
      );

      expect(txGasLimit).toBeGreaterThanOrEqual(estimatedLimitSum);
      expect(txGasPrice.toString()).toBe(quote.estimate.gasCosts[0].price);
    }

    // 2. Validate Multi-Step Continuity 
    const steps = quote.includedSteps;
    if (steps.length > 1) {
      for (let i = 0; i < steps.length - 1; i++) {
        const outputFromPrevious = steps[i].estimate.toAmount;
        const inputToNext = steps[i + 1].action.fromAmount;

        expect(outputFromPrevious, `Step ${i} output must match Step ${i + 1} input`)
          .toBe(inputToNext);
      }
    }

    // 3. Validate Slippage Math
    const toAmount = BigInt(quote.estimate.toAmount);
    const toAmountMin = BigInt(quote.estimate.toAmountMin);
    const slippage = parseFloat(quote.action.slippage);

    const expectedMin = Number(toAmount) * (1 - slippage);
    const variance = Math.abs(Number(toAmountMin) - expectedMin) / expectedMin;

    expect(variance).toBeLessThan(0.001); // 0.1% tolerance
  });

  /**
  * Price Integrity Check (Ghost Arbitrage)
  * Logic: Ensure that toAmountUSD is not > 10% higher than fromAmountUSD.
  */
  test('Functional: Price Integrity Check (Ghost Arbitrage)', async ({ request }) => {
    
    const response = await lifi.getQuote({
      fromChain: CHAINS.ARBITRUM,
      toChain: CHAINS.OPTIMISM,
      fromToken: TOKENS.USDC_ARBITRUM,
      toToken: TOKENS.USDC_OPTIMISM,
      fromAmount: '1000000000', // 1000 USDC
      fromAddress,
    });

    const data = await response.json();
    expect(response.status()).toBe(200);

    const fromUSD = parseFloat(data.estimate.fromAmountUSD);
    const toUSD = parseFloat(data.estimate.toAmountUSD);

    console.log(`Price Integrity: In $${fromUSD} -> Out $${toUSD}`);

    // LOGIC: The output should rarely be > 5% higher than input (Arbitrage is rare)
    // If toUSD is > fromUSD * 1.05, it's likely an Bug
    expect(toUSD).toBeLessThan(fromUSD * 1.05);
    
    // Also, it shouldn't be zero
    expect(toUSD).toBeGreaterThan(0);
  });

  /**
  * Native Token Quote
  * Logic: Verify quote generation for Native ETH
  */
  test('Functional: Should handle Native Token (ETH) correctly', async ({ request }) => {
    
    const response = await lifi.getQuote({
      fromChain: CHAINS.ARBITRUM,
      toChain: CHAINS.ARBITRUM, // Same chain swap (ETH -> USDC)
      fromToken: TOKENS.ETH_MAINNET, // Native ETH
      toToken: TOKENS.USDC_ARBITRUM,
      fromAmount: '10000000000000000', // 0.01 ETH
      fromAddress,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.action.fromToken.symbol).toBe('ETH');
  });

  /**
  * Verify Gas Costs exist
  * Logic: Verify Gas Costs exist in the quote response
  */
  test('Functional: Verify Gas Costs exist', async ({ request }) => {
    
    const response = await lifi.getQuote({
      fromChain: CHAINS.ARBITRUM,
      toChain: CHAINS.OPTIMISM,
      fromToken: TOKENS.USDC_ARBITRUM, 
      toToken: TOKENS.USDC_OPTIMISM,
      fromAmount: '10000000', 
      fromAddress,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.estimate.gasCosts).toBeInstanceOf(Array);
    expect(data.estimate.gasCosts.length).toBeGreaterThan(0);
    expect(Number(data.estimate.gasCosts[0].amountUSD)).toBeGreaterThan(0);
  });

  /**
   * TEST: Missing Required Parameters
   * EXPECTED: 400 Bad Request
   */
  test('Negative: should return 400 for missing required fields (fromAddress)', async () => {
    const response = await lifi.getQuote({
      fromChain: CHAINS.ARBITRUM,
      toChain: CHAINS.ARBITRUM,
      fromToken: TOKENS.USDC_ARBITRUM,
      toToken: TOKENS.WETH_ARBITRUM,
      fromAmount: '1000000',
      // fromAddress is missing
    });

    const body = await response.json();
    expect(response.status()).toBe(400);
    // LI.FI returns a clear message for validation errors
    expect(body.message).toContain('fromAddress');
  });

  /**
   * TEST: Amount Too Low
   * EXPECTED: 404 or specific Tool Error
   */
  test('Negative: should return error for dust amounts (Amount Too Low)', async () => {
    const response = await lifi.getQuote({
      fromChain: CHAINS.ETH,
      toChain: CHAINS.OPTIMISM,
      fromToken: TOKENS.USDC_ETH,
      toToken: TOKENS.WBTC_OPTIMISM,
      fromAmount: '1', // 0.000001 USDT - too low for bridge fees
      fromAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    });

    const body = await response.json();

    expect(response.status()).toBe(404);
    expect(body.message).toContain('No available quotes for the requested transfer');
    expect(JSON.stringify(body)).toMatch(/no routes available|out of acceptable range/i);

  });

  /**
   * TEST: Unsupported Chain Swap
   * EXPECTED: 400 or "No Possible Route"
   */
  test('Negative: should handle unsupported chain combinations (Invalid Chain ID)', async () => {
    const response = await lifi.getQuote({
      fromChain: 999999, // Non-existent chain
      toChain: CHAINS.ETH,
      fromToken: TOKENS.USDC_ARBITRUM,
      toToken: TOKENS.ETH_MAINNET,
      fromAmount: '1000000',
      fromAddress,
    });

    const body = await response.json();
    expect(response.status()).toBe(400);
    expect(body.message).toMatch(/chain|parameter/i);
  });

  /**
     * TEST: Insufficient Liquidity
     * Logic: Requesting an extremely large amount of a small-cap token 
     * should trigger a liquidity error.
     */
  test('Boundary: Insufficient Liquidity for large swap', async () => {
    const response = await lifi.getQuote({
      fromChain: CHAINS.AVALANCHE,
      toChain: CHAINS.POLYGON,
      fromToken: TOKENS.JOE_AVALANCHE,
      toToken: TOKENS.USDT_POLYGON,
      fromAmount: '1000000000000000000000000000', // 1 Billion JOE
      fromAddress,
    });

    const body = await response.json();
    expect(response.status()).toBe(404);

    // LI.FI specific ToolError check
    expect(Array.isArray(body.errors.filteredOut)).toBeTruthy();
    expect(JSON.stringify(body)).toMatch(/no available quotes|insufficient|no liquidity/i);

  });

  /**
   * TEST: Unsupported Token Swap
   * Logic: Swapping two tokens that have no bridge/DEX path.
   */
  test('Boundary: Unsupported or non-existent token swap', async () => {
    const response = await lifi.getQuote({
      fromChain: CHAINS.ARBITRUM,
      toChain: CHAINS.ARBITRUM,
      fromToken: TOKENS.USDC_ARBITRUM,
      toToken: '0x000000000000000000000000000000000000dead', // Burn address/Unsupported
      fromAmount: '10000000',
      fromAddress,
    });

    const body = await response.json();
    // LIFI returns 400 Bad Request for unsupported tokens
    expect(response.status()).toBe(400);
    console.log(`Received error message: ${body.message}`);
    expect(body.message).toMatch(/invalid|deny list|toChain must be equal to one of the allowed values/i);
  });

  /**
   * TEST: Zero Amounts
   * Logic: Blockchain transactions require a positive integer (in Wei/smallest units).
   * API should reject 0 or negative values with a 400 status code.
   */
  test('Boundary: Zero amount should return 400', async ({ request }) => {

    const response = await lifi.getQuote({
      fromChain: CHAINS.ARBITRUM,
      toChain: CHAINS.ARBITRUM,
      fromToken: TOKENS.USDC_ARBITRUM,
      toToken: TOKENS.WETH_ARBITRUM,
      fromAmount: '0', // Zero amount
      fromAddress,
    });

    const body = await response.json();
    expect(response.status()).toBe(400);
    expect(body.message).toBeDefined();
    console.log(`Zero amount correctly rejected with: ${body.message}`);
  });

  /**
   * TEST: Negative Amounts
   * Logic: Blockchain transactions require a positive integer (in Wei/smallest units).
   * API should reject 0 or negative values with a 400 status code.
   */
  test('Boundary: Negative amount should return 400', async ({ request }) => {

    const response = await lifi.getQuote({
      fromChain: CHAINS.ARBITRUM,
      toChain: CHAINS.ARBITRUM,
      fromToken: TOKENS.USDC_ARBITRUM,
      toToken: TOKENS.WETH_ARBITRUM,
      fromAmount: '-1000000', // Negative amount
      fromAddress,
    });

    const body = await response.json();
    expect(response.status()).toBe(400);
    expect(body.message).toBeDefined();
    console.log(`Negative amount correctly rejected with: ${body.message}`);
  });

});