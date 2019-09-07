// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package contract

import (
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = abi.U256
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
)

// ContractABI is the input ABI used to generate the binding from.
const ContractABI = "[{\"constant\":false,\"inputs\":[{\"name\":\"_a\",\"type\":\"uint256\"},{\"name\":\"_b\",\"type\":\"uint256\"},{\"name\":\"_c\",\"type\":\"uint256\"},{\"name\":\"_d\",\"type\":\"uint256\"},{\"name\":\"_e\",\"type\":\"uint256\"},{\"name\":\"_f\",\"type\":\"uint256\"},{\"name\":\"_g\",\"type\":\"uint256\"},{\"name\":\"_h\",\"type\":\"uint256\"},{\"name\":\"_i\",\"type\":\"bytes32\"},{\"name\":\"_j\",\"type\":\"bytes32\"},{\"name\":\"_k\",\"type\":\"bytes32\"},{\"name\":\"_l\",\"type\":\"bytes32\"},{\"name\":\"_m\",\"type\":\"bytes32\"},{\"name\":\"_n\",\"type\":\"bytes32\"}],\"name\":\"test\",\"outputs\":[{\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"print\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"},{\"name\":\"\",\"type\":\"uint256\"},{\"name\":\"\",\"type\":\"uint256\"},{\"name\":\"\",\"type\":\"uint256\"},{\"name\":\"\",\"type\":\"uint256\"},{\"name\":\"\",\"type\":\"uint256\"},{\"name\":\"\",\"type\":\"uint256\"},{\"name\":\"\",\"type\":\"uint256\"},{\"name\":\"\",\"type\":\"bytes32\"},{\"name\":\"\",\"type\":\"bytes32\"},{\"name\":\"\",\"type\":\"bytes32\"},{\"name\":\"\",\"type\":\"bytes32\"},{\"name\":\"\",\"type\":\"bytes32\"},{\"name\":\"\",\"type\":\"bytes32\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]"

// ContractBin is the compiled bytecode used for deploying new contracts.
const ContractBin = `0x608060405234801561001057600080fd5b50610297806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806313bdfacd1461003b578063811588ae146100b4575b600080fd5b61004361017d565b604051808f81526020018e81526020018d81526020018c81526020018b81526020018a81526020018981526020018881526020018781526020018681526020018581526020018481526020018381526020018281526020019e50505050505050505050505050505060405180910390f35b61016360048036036101c08110156100cb57600080fd5b8101908080359060200190929190803590602001909291908035906020019092919080359060200190929190803590602001909291908035906020019092919080359060200190929190803590602001909291908035906020019092919080359060200190929190803590602001909291908035906020019092919080359060200190929190803590602001909291905050506101e8565b604051808215151515815260200191505060405180910390f35b600080600080600080600080600080600080600080600054600154600254600354600454600554600654600754600854600954600a54600b54600c54600d549d509d509d509d509d509d509d509d509d509d509d509d509d509d50909192939495969798999a9b9c9d565b60008e6000819055508d6001819055508c6002819055508b6003819055508a600481905550896005819055508860068190555087600781905550866008819055508560098190555084600a8190555083600b8190555082600c8190555081600d81905550600190509e9d505050505050505050505050505056fea265627a7a723058209894c71fbe43c0ff1d4e053a37f3fabc14e8b324e9817a78bdd28acab29ebed064736f6c634300050a0032`

// DeployContract deploys a new Ethereum contract, binding an instance of Contract to it.
func DeployContract(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *Contract, error) {
	parsed, err := abi.JSON(strings.NewReader(ContractABI))
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	address, tx, contract, err := bind.DeployContract(auth, parsed, common.FromHex(ContractBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &Contract{ContractCaller: ContractCaller{contract: contract}, ContractTransactor: ContractTransactor{contract: contract}, ContractFilterer: ContractFilterer{contract: contract}}, nil
}

// Contract is an auto generated Go binding around an Ethereum contract.
type Contract struct {
	ContractCaller     // Read-only binding to the contract
	ContractTransactor // Write-only binding to the contract
	ContractFilterer   // Log filterer for contract events
}

// ContractCaller is an auto generated read-only Go binding around an Ethereum contract.
type ContractCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ContractTransactor is an auto generated write-only Go binding around an Ethereum contract.
type ContractTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ContractFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type ContractFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ContractSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type ContractSession struct {
	Contract     *Contract         // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// ContractCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type ContractCallerSession struct {
	Contract *ContractCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts   // Call options to use throughout this session
}

// ContractTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type ContractTransactorSession struct {
	Contract     *ContractTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts   // Transaction auth options to use throughout this session
}

// ContractRaw is an auto generated low-level Go binding around an Ethereum contract.
type ContractRaw struct {
	Contract *Contract // Generic contract binding to access the raw methods on
}

// ContractCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type ContractCallerRaw struct {
	Contract *ContractCaller // Generic read-only contract binding to access the raw methods on
}

// ContractTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type ContractTransactorRaw struct {
	Contract *ContractTransactor // Generic write-only contract binding to access the raw methods on
}

// NewContract creates a new instance of Contract, bound to a specific deployed contract.
func NewContract(address common.Address, backend bind.ContractBackend) (*Contract, error) {
	contract, err := bindContract(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Contract{ContractCaller: ContractCaller{contract: contract}, ContractTransactor: ContractTransactor{contract: contract}, ContractFilterer: ContractFilterer{contract: contract}}, nil
}

// NewContractCaller creates a new read-only instance of Contract, bound to a specific deployed contract.
func NewContractCaller(address common.Address, caller bind.ContractCaller) (*ContractCaller, error) {
	contract, err := bindContract(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &ContractCaller{contract: contract}, nil
}

// NewContractTransactor creates a new write-only instance of Contract, bound to a specific deployed contract.
func NewContractTransactor(address common.Address, transactor bind.ContractTransactor) (*ContractTransactor, error) {
	contract, err := bindContract(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &ContractTransactor{contract: contract}, nil
}

// NewContractFilterer creates a new log filterer instance of Contract, bound to a specific deployed contract.
func NewContractFilterer(address common.Address, filterer bind.ContractFilterer) (*ContractFilterer, error) {
	contract, err := bindContract(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &ContractFilterer{contract: contract}, nil
}

// bindContract binds a generic wrapper to an already deployed contract.
func bindContract(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(ContractABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Contract *ContractRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _Contract.Contract.ContractCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Contract *ContractRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Contract.Contract.ContractTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Contract *ContractRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Contract.Contract.ContractTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Contract *ContractCallerRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _Contract.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Contract *ContractTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Contract.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Contract *ContractTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Contract.Contract.contract.Transact(opts, method, params...)
}

// Print is a free data retrieval call binding the contract method 0x13bdfacd.
//
// Solidity: function print() constant returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, bytes32, bytes32, bytes32, bytes32, bytes32, bytes32)
func (_Contract *ContractCaller) Print(opts *bind.CallOpts) (*big.Int, *big.Int, *big.Int, *big.Int, *big.Int, *big.Int, *big.Int, *big.Int, [32]byte, [32]byte, [32]byte, [32]byte, [32]byte, [32]byte, error) {
	var (
		ret0  = new(*big.Int)
		ret1  = new(*big.Int)
		ret2  = new(*big.Int)
		ret3  = new(*big.Int)
		ret4  = new(*big.Int)
		ret5  = new(*big.Int)
		ret6  = new(*big.Int)
		ret7  = new(*big.Int)
		ret8  = new([32]byte)
		ret9  = new([32]byte)
		ret10 = new([32]byte)
		ret11 = new([32]byte)
		ret12 = new([32]byte)
		ret13 = new([32]byte)
	)
	out := &[]interface{}{
		ret0,
		ret1,
		ret2,
		ret3,
		ret4,
		ret5,
		ret6,
		ret7,
		ret8,
		ret9,
		ret10,
		ret11,
		ret12,
		ret13,
	}
	err := _Contract.contract.Call(opts, out, "print")
	return *ret0, *ret1, *ret2, *ret3, *ret4, *ret5, *ret6, *ret7, *ret8, *ret9, *ret10, *ret11, *ret12, *ret13, err
}

// Print is a free data retrieval call binding the contract method 0x13bdfacd.
//
// Solidity: function print() constant returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, bytes32, bytes32, bytes32, bytes32, bytes32, bytes32)
func (_Contract *ContractSession) Print() (*big.Int, *big.Int, *big.Int, *big.Int, *big.Int, *big.Int, *big.Int, *big.Int, [32]byte, [32]byte, [32]byte, [32]byte, [32]byte, [32]byte, error) {
	return _Contract.Contract.Print(&_Contract.CallOpts)
}

// Print is a free data retrieval call binding the contract method 0x13bdfacd.
//
// Solidity: function print() constant returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, bytes32, bytes32, bytes32, bytes32, bytes32, bytes32)
func (_Contract *ContractCallerSession) Print() (*big.Int, *big.Int, *big.Int, *big.Int, *big.Int, *big.Int, *big.Int, *big.Int, [32]byte, [32]byte, [32]byte, [32]byte, [32]byte, [32]byte, error) {
	return _Contract.Contract.Print(&_Contract.CallOpts)
}

// Test is a paid mutator transaction binding the contract method 0x811588ae.
//
// Solidity: function test(uint256 _a, uint256 _b, uint256 _c, uint256 _d, uint256 _e, uint256 _f, uint256 _g, uint256 _h, bytes32 _i, bytes32 _j, bytes32 _k, bytes32 _l, bytes32 _m, bytes32 _n) returns(bool)
func (_Contract *ContractTransactor) Test(opts *bind.TransactOpts, _a *big.Int, _b *big.Int, _c *big.Int, _d *big.Int, _e *big.Int, _f *big.Int, _g *big.Int, _h *big.Int, _i [32]byte, _j [32]byte, _k [32]byte, _l [32]byte, _m [32]byte, _n [32]byte) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "test", _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n)
}

// Test is a paid mutator transaction binding the contract method 0x811588ae.
//
// Solidity: function test(uint256 _a, uint256 _b, uint256 _c, uint256 _d, uint256 _e, uint256 _f, uint256 _g, uint256 _h, bytes32 _i, bytes32 _j, bytes32 _k, bytes32 _l, bytes32 _m, bytes32 _n) returns(bool)
func (_Contract *ContractSession) Test(_a *big.Int, _b *big.Int, _c *big.Int, _d *big.Int, _e *big.Int, _f *big.Int, _g *big.Int, _h *big.Int, _i [32]byte, _j [32]byte, _k [32]byte, _l [32]byte, _m [32]byte, _n [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.Test(&_Contract.TransactOpts, _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n)
}

// Test is a paid mutator transaction binding the contract method 0x811588ae.
//
// Solidity: function test(uint256 _a, uint256 _b, uint256 _c, uint256 _d, uint256 _e, uint256 _f, uint256 _g, uint256 _h, bytes32 _i, bytes32 _j, bytes32 _k, bytes32 _l, bytes32 _m, bytes32 _n) returns(bool)
func (_Contract *ContractTransactorSession) Test(_a *big.Int, _b *big.Int, _c *big.Int, _d *big.Int, _e *big.Int, _f *big.Int, _g *big.Int, _h *big.Int, _i [32]byte, _j [32]byte, _k [32]byte, _l [32]byte, _m [32]byte, _n [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.Test(&_Contract.TransactOpts, _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n)
}
