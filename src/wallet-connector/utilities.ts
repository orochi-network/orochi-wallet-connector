export const toChainIdString = (chainId: number): string => `0x${Number(chainId).toString(16)}`;

export const toChainIdNumber = (chainId: string): number => parseInt(chainId.replace(/^0x/i, '').trim(), 16);

export const networkData: { [key: string]: any } = {
  '0x38': {
    chainId: '0x38',
    chainName: 'Binance Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/'],
  },
  '0xfa': {
    chainId: '0xfa',
    chainName: 'Fantom Opera',
    nativeCurrency: { name: 'FTM', symbol: 'FTM', decimals: 18 },
    rpcUrls: ['https://rpc2.fantom.network/'],
    blockExplorerUrls: ['https://ftmscan.com/'],
  },
  '0xfa2': {
    chainId: '0xfa2',
    chainName: 'Fantom Testnet',
    nativeCurrency: { name: 'FTM', symbol: 'FTM', decimals: 18 },
    rpcUrls: ['https://xapi.testnet.fantom.network/lachesis'],
    blockExplorerUrls: ['https://testnet.ftmscan.com'],
  },
  '0x7a69': {
    chainId: '0x7a69',
    chainName: 'Localhost',
    nativeCurrency: { name: 'TEST', symbol: 'TEST', decimals: 18 },
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: ['http://127.0.0.1:8545'],
  },
  '0x89': {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com/'],
  },
  '0x13881': {
    chainId: '0x13881',
    chainName: 'Mumbai Testnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://rpc-mumbai.matic.today/'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
  },
};

const onceSync = new Map<string, boolean>();

export const once = (name: string, callback: () => void) => {
  if (!onceSync.has(name) || !onceSync.get(name)) {
    callback();
    onceSync.set(name, true);
  }
};

export const toKey = (v: string): string => v.toLowerCase().replace(/\s/g, '');

export const toCamelCase = (v: string): string =>
  v
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index: number) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
