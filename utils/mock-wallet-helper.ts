export const injectMockWallet = (address: string = '0x1234567890abcdef1234567890abcdef12345678') => {
  return `
    (function() {
      const mockProvider = {
        isMetaMask: true,
        chainId: '0x1',
        request: async ({ method }) => {
          if (method === 'eth_requestAccounts' || method === 'eth_accounts') return ['${address}'];
          if (method === 'eth_chainId') return '0x1';
          return null;
        },
        on: () => {},
        removeListener: () => {}
      };
      window.ethereum = mockProvider;
      const announce = () => {
        window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
          detail: {
            info: {
              uuid: '350670db-e909-4573-bc7d-3438853bca00',
              name: 'MetaMask',
              rdns: 'io.metamask'
            },
            provider: mockProvider
          }
        }));
      };
      announce();
      window.addEventListener('eip6963:requestProvider', announce);
    })();
  `;
};