import { test, expect } from '@playwright/test';
import { LifiApi } from '../../utils/api-helpers';
import Ajv from 'ajv';
import { ToolsSchema } from '../../utils/schemas';
import { CHAINS, CHAIN_KEYS } from '../../utils/constants';

test.describe('LI.FI Tools API - GET /v1/tools', () => {
  let lifi: LifiApi;
  const ajv = new Ajv({ allErrors: true, formats: { uri: true } });
  const validate = ajv.compile(ToolsSchema);

  test.beforeEach(async ({ request }) => {
    lifi = new LifiApi(request);
  });

  /**
   * TEST: Global Tools Retrieval & Schema Integrity
   * INTENT: Ensure the master list of bridges/exchanges is available and follows the data contract.
   */
  test('Functional: should return all available tools and match schema', async () => {
    const response = await lifi.getTools();
    const body = await response.json();
    expect(response.status()).toBe(200);

    // Ensure we actually have data
    expect(body.bridges.length).toBeGreaterThan(0);
    expect(body.exchanges.length).toBeGreaterThan(0);

    const valid = validate(body);
    // Detailed error reporting
    if (!valid) {
      console.error('AJV Schema Validation Errors:', JSON.stringify(validate.errors, null, 2));
    }

    expect(valid, `Schema validation failed. Check console for details.`).toBe(true);

  });

  /**
    * TEST: Chain-Specific Filtering
    * INTENT: Verify that the 'chains' query parameter correctly filters the bridge list.
    */
  test('Functional: Filter tools by specific chain (Polygon)', async () => {
    const targetChainId = CHAINS.POLYGON; // 137
    const response = await lifi.getTools(targetChainId.toString());
    const body = await response.json();
    expect(response.status()).toBe(200);

    // Every bridge returned MUST have at least one route involving the target chain.
    for (const bridge of body.bridges) {
      const hasTargetChainSupport = bridge.supportedChains.some(
        (connection: { fromChainId: number; toChainId: number }) =>
          connection.fromChainId === targetChainId || connection.toChainId === targetChainId
      );

      expect(hasTargetChainSupport,
        `Bridge ${bridge.name} (${bridge.key}) was returned for chain ${targetChainId} but does not list it in supportedChains.`
      ).toBe(true);
    }

    // Ensure exchanges are also filtered correctly
    const allExchangesSupportPolygon = body.exchanges.every((ex: any) =>
      ex.supportedChains.includes(targetChainId)
    );
    expect(allExchangesSupportPolygon, 'All returned exchanges must support the filtered chain ID').toBe(true);

    console.log(`Verified ${body.bridges.length} bridges and ${body.exchanges.length} exchanges for Polygon`);
  });


  test('Functional: Validate tools for Solana, Bitcoin, and SUI', async ({ request }) => {
    const chainsQuery = `${CHAIN_KEYS.SOLANA},${CHAIN_KEYS.BITCOIN},${CHAIN_KEYS.SUI}`;
    const response = await lifi.getTools(chainsQuery);
    const body = await response.json();
    expect(response.status()).toBe(200);

    // Helper to check if a bridge supports a specific chain ID
    const bridgeSupports = (bridge: any, chainId: number) =>
      bridge.supportedChains.some((c: any) => c.fromChainId === chainId || c.toChainId === chainId);

    // 1. Validate Bitcoin Bridge (e.g., Chainflip or Relay)
    const hasBtcBridge = body.bridges.some((br: any) => bridgeSupports(br, CHAINS.BITCOIN));
    expect(hasBtcBridge).toBeTruthy();

    // 2. Validate Solana Exchange (e.g., Jupiter or OKX)
    const hasSolanaDex = body.exchanges.some((ex: any) => ex.supportedChains.includes(CHAINS.SOLANA));
    expect(hasSolanaDex).toBeTruthy();

    // 3. Validate SUI Exchange (e.g., Aftermath or Cetus)
    const hasSuiDex = body.exchanges.some((ex: any) => ex.supportedChains.includes(CHAINS.SUI));
    expect(hasSuiDex).toBeTruthy();
  });

  /**
   * TEST: Invalid Chain Parameter
   * INTENT: Verify that malformed chain keys are rejected gracefully.
   */
  test('Negative: Handle invalid chain identifier', async () => {
    const response = await lifi.getTools('INVALID_CHAIN_ID');
    expect(response.status()).toBe(400);
  });

  /**
   * TEST: Fake Chain name
   * INTENT: Verify that malformed chain keys are rejected gracefully.
   */
  test('Negative: should handle invalid chain identifiers gracefully', async () => {
    // Using a completely fake chain name
    const response = await lifi.getTools('MARS_CHAIN_999');
    const body = await response.json();
    expect(response.status()).toBe(400);
    expect(body.message).toMatch(/invalid|chain/i);
  });

});