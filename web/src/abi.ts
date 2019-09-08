const abi = [
  {
    "inputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "utxo",
        "type": "uint256"
      }
    ],
    "name": "AddUtxo",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "nullifier",
        "type": "uint256"
      }
    ],
    "name": "AddNullifier",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "AddEcryptedUtxoMessage",
    "type": "event"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "merkleRoot",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "input",
        "type": "uint256[]"
      },
      {
        "name": "proof",
        "type": "uint256[]"
      },
      {
        "name": "encdata1",
        "type": "bytes"
      }
    ],
    "name": "deposit",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": true,
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "input",
        "type": "uint256[]"
      },
      {
        "name": "proof",
        "type": "uint256[]"
      },
      {
        "name": "encdata1",
        "type": "bytes"
      },
      {
        "name": "encdata2",
        "type": "bytes"
      }
    ],
    "name": "withdrawal",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "input",
        "type": "uint256[]"
      },
      {
        "name": "proof",
        "type": "uint256[]"
      },
      {
        "name": "encdata1",
        "type": "bytes"
      },
      {
        "name": "encdata2",
        "type": "bytes"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default abi;
