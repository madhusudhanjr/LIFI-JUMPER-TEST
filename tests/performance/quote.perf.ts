import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { ADDRESS, CHAINS, TOKENS } from '../../utils/constants.ts';

// 1. Define Performance Configuration
export const options: Options = {
  scenarios: {
    parallel_swaps: {
      executor: 'constant-vus',
      vus: 50,           // Simulate 50 parallel users
      duration: '30s',   // Run the test for 30 seconds
    },
  },
  thresholds: {
    // Assertions for performance: 95% of requests must be under 2s
    http_req_duration: ['p(95)<2000'],
    // Error rate must be less than 1%
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const url = 'https://li.quest/v1/quote';

  // 2. Define Request Parameters
  const params = {
    fromChain: CHAINS.ARBITRUM,
    toChain: CHAINS.ARBITRUM,
    fromToken: TOKENS.USDC_ARBITRUM,
    toToken: TOKENS.ETH_MAINNET,
    fromAddress: ADDRESS.FROM_ADDRESS,
    fromAmount: '1000000', // 1 USDC
  };

  const headers = {
    'Content-Type': 'application/json',
    // 'x-lifi-api-key': 'YOUR_API_KEY_HERE', // Add your key to bypass 429 Rate limit errors
  };

  // Convert params to a query string
  const queryString = Object.keys(params)
    .map(key => `${key}=${params[key as keyof typeof params]}`)
    .join('&');

  // 3. Execute HTTP GET Request
  const res = http.get(`${url}?${queryString}`);

  // 4. Validate Response
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has route tool': (r) => r.json('tool') !== null,
  });

  // 5. Log failures for debugging

  if (res.status !== 200) {
    console.log(`Request Failed! Status: ${res.status}`);
    console.log(`URL: ${res.url}`);
    console.log(`Response Body: ${res.body}`);
  }

  // Small sleep to prevent "infinite loop" symptoms and mimic real user behavior
  sleep(1);
}