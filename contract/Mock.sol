pragma solidity ^0.5.10;

contract Mock{
    
    uint256 a;
    uint256 b;
    uint256 c; 
    uint256 d; 
    uint256 e; 
    uint256 f;
    uint256 g;
    uint256 h;
    bytes32 i;
    bytes32 j;
    bytes32 k;
    bytes32 l;
    bytes32 m;
    bytes32 n;
    
    function test(
        uint256 _a, 
        uint256 _b, 
        uint256 _c, 
        uint256 _d, 
        uint256 _e, 
        uint256 _f,
        uint256 _g,
        uint256 _h,
        bytes32 _i,
        bytes32 _j,
        bytes32 _k,
        bytes32 _l,
        bytes32 _m,
        bytes32 _n
        ) public returns(bool) {
            a = _a;
            b = _b;
            c = _c;
            d = _d;
            e = _e;
            f = _f;
            g = _g;
            h = _h;
            i = _i;
            j = _j;
            k = _k;
            l = _l;
            m = _m;
            n = _n;
            return true;
        }
        
    function print() public view returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, bytes32, bytes32, bytes32, bytes32, bytes32, bytes32){
        return (a, b, c, d, e, f, g, h, i, j, k, l, m, n);
    }
    
}