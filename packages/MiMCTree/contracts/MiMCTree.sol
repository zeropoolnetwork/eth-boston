pragma solidity >=0.5.2;


// MiMCpe7 placeholder for linking bytecode from https://github.com/iden3/circomlib/blob/master/src/mimc_gencontract.js
library MiMC {
  function MiMCpe7(uint256 in_x, uint256 in_k) pure public returns(uint256 out_x);
}


// this is hackathon edition. Not optimized!
contract MiMCTree {
  uint256 constant proofLength = 30;
  uint256 constant height = proofLength+1;
  uint256 cursor = 0;

  uint256[height] merkleDefaults;
  uint256[height] rightPath;

  constructor() public {
    merkleDefaults[0] = 0;
    for(uint i = 1; i < height; i++ ) {
      merkleDefaults[i] = hash(merkleDefaults[i-1], merkleDefaults[i-1]);
      rightPath[i] = merkleDefaults[i];
    }
  }

  function _merklePush(uint256[] memory items) internal {
    uint256[height] memory _rightPath = rightPath;
    uint256 _cursor = cursor;
    for(uint i=0; i < items.length; i++) {
      uint256 item = items[i];
      uint256 item_next = 0;
      uint256 t = _cursor;
      for(uint j=0; j < height-1; j++) {
        if ((t & 1)==0) {
          item_next = hash(item, merkleDefaults[j]);
        } else {
          item_next = hash(_rightPath[j], item);
        }
        _rightPath[j] = item;
        item = item_next;
        t = t >> 1;
      }
      _rightPath[height-1] = item_next;
      _cursor += 1;
    }
    rightPath = _rightPath;
    cursor = _cursor;
  }

  function testPush(uint[] memory items) public returns(bool) {
    _merklePush(items);
    return true;
  }

  function merkleRoot() public view returns(uint256) {
    return rightPath[height-1];
  }

  function hash(uint256 a, uint256 b) internal pure returns(uint256) {
    uint256 p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 r = addmod(a, MiMC.MiMCpe7(a,0), p);
    r = addmod(addmod(r, b, p), MiMC.MiMCpe7(b,r), p);
    return r;
  }

  function test(uint256 a, uint256 b) public pure returns(uint256) {
    return MiMC.MiMCpe7(a, b);
  }
}
