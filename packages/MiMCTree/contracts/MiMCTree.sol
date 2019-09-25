pragma solidity >=0.5.2;

import "groth16batchverifier/contracts/Groth16Verifier.sol";

// MiMCpe7 placeholder for linking bytecode from https://github.com/iden3/circomlib/blob/master/src/mimc_gencontract.js
library MiMC {
  function MiMCpe7(uint256 in_x, uint256 in_k) pure public returns(uint256 out_x);
}


// this is hackathon edition. Not optimized!
contract MiMCTree {
  using Groth16Verifier for Groth16Verifier.G1Point;
  using Groth16Verifier for Groth16Verifier.G2Point;



  uint256 constant proofLength = 30;
  uint256 constant height = proofLength+1;
  uint256[] vk = [
    16998550835308717596021269693023145348120940320458380850783345104936803943714,
    19043499103541205113220604030308080901976563967840098287208365622667556166068,
    7272313765343817734167737917776736120505349704739893741698895290157800499590,
    2918228845876645706381840785259156044672755724748085883189097491696733137923,
    11950240970782622159251526920772075308296135088314917750698133649753823179525,
    795370460138836418326172922983574838337397958662331904131391209315578440986,
    7807636614181477983860779017426749189194298032374736785221740993219924270749,
    3024637250645993282178369109797331157218491014949291690150802743503938463953,
    19668542239946149719769746895836057894641376721279600175343934539848933843207,
    17202258242412761961893122932534614205218628098416290865670903537499719847005,
    12563609628724892494628593665476390665583874622033588438590407309859950429146,
    14750326016051787920513556578982953607181563197899421866574345180902605748361,
    4938265824265223491862206749651453848780175133247912167639757629366609057820,
    2632074105443279689841381535269779338466610112286935829531380657192174723449,
    447992092238902941743048272904918472280871221204019499354521876792231644968,
    5254365890574538317197301579062188360496463507220520154707015309719368789450,
    4213809056985455803207041067877588451061248167066078397552184005827705823669,
    15070311698338843271004369921844801677732002928838834042356554264356726870192,
    5528321114220897112206785769658079301778731641603853480842271736945334707682,
    9654944572869725735706839773504567513521928470340825342206171060878440199234,
    132939734485949527832074557954506207068845339535867999356964190462738148342,
    18322799065117783267917059217109112384735583249373844456234663991533246511355,
    9770881878810399461042283591107097718795076765574127350964739427248188900665,
    19533028314111659475571093805398295607509358966433527230617900047143195805976,
    9626032357886362634269022226341128225876176857633215827383263866889032984668,
    12521522981040737983013607254110491309018942918024191696879723789370923730652,
    7993868889094857363985950277104446922427099886008115581738774796866991992440,
    18829060224684239846330505480744652591084664759131281442074415377596383837090
  ];
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

  function merkleRoot() public view returns(uint256) {
    return rightPath[height-1];
  }

  function hash(uint256 a, uint256 b) internal pure returns(uint256) {
    uint256 p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 r = addmod(a, MiMC.MiMCpe7(a,0), p);
    r = addmod(addmod(r, b, p), MiMC.MiMCpe7(b,r), p);
    return r;
  }

  event AddUtxo(uint256 utxo);
  event AddNullifier(uint256 nullifier);
  event AddEcryptedUtxoMessage(bytes data);

  mapping (uint256=>bool) nullifier;

    // deposit for ethereum
    function deposit(uint[] memory input, uint[] memory proof, bytes memory encdata1) public payable returns(bool) {

      uint assetId = input[4] & 0xFFFF;
      uint amount = input[4] >> 16;

      require(amount==msg.value, "1");
      require(assetId==0, "2");
      require(input[5]==0, "3");
      require(Groth16Verifier.verify(input, proof, vk), "4");

      uint[] memory utxos = new uint[](1);
      utxos[0] = input[3];

      _merklePush(utxos);

      emit AddUtxo(input[3]);
      emit AddEcryptedUtxoMessage(encdata1);
      return true;
    }


  //withdrawal for ethereum
  function withdrawal(uint[] memory input, uint[] memory proof, bytes memory encdata1, bytes memory encdata2) public returns(bool) {
    uint assetId = input[4] & 0xFFFF;
    uint amount = input[4] >> 16;
    address payable target = address(uint160(input[5]));
    require((nullifier[input[1]] || nullifier[input[2]]) == false, "(nullifier[input[1]] || nullifier[input[2]]) != false");
    require(merkleRoot()==input[0], "merkleRoot() != input[0]");
    require(assetId==0, "assetId != 0");
    require((input[5] >> 160) == 1, "input[5] >> 160 != 1");
    require(Groth16Verifier.verify(input, proof, vk), "verify failed");
    uint[] memory utxos = new uint[](1);
    utxos[0] = input[3];
    _merklePush(utxos);
    emit AddUtxo(input[3]);
    emit AddUtxo(input[4]);
    emit AddEcryptedUtxoMessage(encdata1);
    emit AddEcryptedUtxoMessage(encdata2);
    nullifier[input[1]] = true;
    nullifier[input[2]] = true;
    target.transfer(amount);
    return true;
  }

/*
  signal input root;
  signal input n1;
  signal input n2_or_u_in;
  signal input out_u1;
  signal input out_u2_or_asset;
  signal input txtype;
*/
  //transfer for ethereum
  function transfer(uint[] memory input, uint[] memory proof, bytes memory encdata1, bytes memory encdata2) public returns(bool) {
    require((nullifier[input[1]] || nullifier[input[2]]) == false);
    require(merkleRoot()==input[0]);
    require((input[5] >> 160) == 2);
    require(Groth16Verifier.verify(input, proof, vk));
    uint[] memory utxos = new uint[](2);
    utxos[0] = input[3];
    utxos[1] = input[4];
    _merklePush(utxos);
    emit AddUtxo(input[3]);
    emit AddUtxo(input[4]);
    emit AddEcryptedUtxoMessage(encdata1);
    emit AddEcryptedUtxoMessage(encdata2);
    nullifier[input[1]] = true;
    nullifier[input[2]] = true;
    return true;
  }

}
