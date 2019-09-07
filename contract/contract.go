package contract

import (
	"context"
	"crypto/ecdsa"
	"log"
	"math/big"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"strings"
)

type SmartContract struct {
	NetworkID types.EIP155Signer
	Address   common.Address
	Client    *ethclient.Client
	Instance  *Contract
}

func ConnectContract(endpoint string, contractAddress string) (*SmartContract, error) {
	client, err := ethclient.Dial(endpoint)
	if err != nil {
		return nil, err
	}
	chainID, err := client.NetworkID(context.Background())
	if err != nil {
		return nil, err
	}
	address := common.HexToAddress(contractAddress)

	instance, err := NewContract(address, client)
	if err != nil {
		return nil, err
	}

	return &SmartContract{
		NetworkID: types.NewEIP155Signer(chainID),
		Address:   address,
		Client:    client,
		Instance: instance,
	}, nil
}

func (contract *SmartContract) SignTransaction(hexPrivateKey string, value *big.Int, data []byte) (*types.Transaction, error) {
	privateKey, err := crypto.HexToECDSA(hexPrivateKey)
	if err != nil {
		return nil, err
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		log.Fatal("cannot assert type: publicKey is not of type *ecdsa.PublicKey")
	}
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
	nonce, err := contract.Client.PendingNonceAt(context.Background(), fromAddress)
	if err != nil {
		return nil, err
	}

	gasPrice, err := contract.Client.SuggestGasPrice(context.Background())
	if err != nil {
		return nil, err
	}

	gasLimit, err := contract.Client.EstimateGas(context.Background(), ethereum.CallMsg{
		From:     fromAddress,
		Value:    value,
		To:       &contract.Address,
		GasPrice: gasPrice,
		Data:     data,
	})
	if err != nil {
		return nil, err
	}

	tx := types.NewTransaction(nonce, contract.Address, value, gasLimit, gasPrice, data)
	signedTx, err := types.SignTx(tx, contract.NetworkID, privateKey)
	if err != nil {
		return nil, err
	}
	return signedTx, nil
}

func (contract *SmartContract) SendSignedTransaction(signedTx *types.Transaction) (string, error) {
	err := contract.Client.SendTransaction(context.Background(), signedTx)
	if err != nil {
		return "", err
	}
	return signedTx.Hash().Hex(), nil
}

func (contract *SmartContract) GetDataByteCode(methodName string, params ...interface{}) ([]byte, error) {
	airdropAbi, err := abi.JSON(strings.NewReader(ContractABI))
	if err != nil {
		return nil, err
	}
	return airdropAbi.Pack(methodName, params...)
}