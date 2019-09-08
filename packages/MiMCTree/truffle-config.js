const env = process.env;
if (env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const HDWalletProvider = require('truffle-hdwallet-provider');


module.exports = {
  compilers: {
    solc: {
      version: "0.5.2",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  networks: {
    // development: {
    //   host: 'localhost',
    //   port: 8545,
    //   network_id: '*', // eslint-disable-line camelcase
    // },
    // ropsten: {
    //   provider: new HDWalletProvider(process.env.PRIVATE_KEY, "https://ropsten.infura.io/"),
    //   network_id: 3, // eslint-disable-line camelcase
    //   skipDryRun: true
    // },
    // coverage: {
    //   host: 'localhost',
    //   network_id: '*', // eslint-disable-line camelcase
    //   port: 8555,
    //   gas: 0xfffffffffff,
    //   gasPrice: 0x01,
    // },
    // testrpc: {
    //   host: 'localhost',
    //   port: 8545,
    //   network_id: '*', // eslint-disable-line camelcase
    // },
    // ganache: {
    //   host: 'localhost',
    //   port: 8545,
    //   network_id: '*', // eslint-disable-line camelcase
    // },
    // rinkeby: {
    //   provider: new HDWalletProvider(process.env.PRIVATE_KEY, "https://rinkeby.infura.io/"),
    //   network_id: 4,
    //   skipDryRun: true
    // },
    kovan: {
      provider: new HDWalletProvider("e6d304fa1be77229d017b21156265f910a2f4db98a09c39d3f2f18d75639fd5e", "https://kovan.infura.io/v3/c7463beadf2144e68646ff049917b716"),
      network_id: 42,
      skipDryRun: true
    },
    mainnet: {
      provider: new HDWalletProvider("e6d304fa1be77229d017b21156265f910a2f4db98a09c39d3f2f18d75639fd5e", "https://mainnet.infura.io/v3/c7463beadf2144e68646ff049917b716"),
      network_id: 1,
      skipDryRun: true
    },
    // sokol: {
    //   provider: new HDWalletProvider(process.env.PRIVATE_KEY, "https://sokol.poa.network/"),
    //   network_id: "*", // Match any network id
    //   skipDryRun: true
    // },
    // skale: {
    //   provider: new HDWalletProvider(process.env.PRIVATE_KEY, "http://157.230.154.5:8134/"),
    //   gasPrice: 0,
    //   network_id: "*",
    //   skipDryRun: true
    // },
    // thunder: {
    //   provider: new HDWalletProvider(process.env.PRIVATE_KEY, "https://mainnet-rpc.thundercore.com/"),
    //   network_id: "*",
    //   gas: 3000000,
    //   gasPrice: 20000000000
    // },
  },
};
