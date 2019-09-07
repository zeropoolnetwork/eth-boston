package contract

import (
	"testing"
	"os"
	"math/big"
	"log"
)

func TestSend(t *testing.T){
	sm, err := ConnectContract("https://rinkeby.infura.io", "0x6fa5e3cb3d351f4ff8529e97d334323d6fe01d1a")
	if err != nil{
		t.Error(err)
	}

	fp :=  big.NewInt(1)
	sp := [32]byte{}

	data, err := sm.GetDataByteCode("test",fp,fp,fp,fp,fp,fp,fp,fp,sp,sp,sp,sp,sp,sp)
	if err != nil{
		t.Error(err)
	}

	tx, err := sm.SignTransaction(os.Getenv("PRIVATE_KEY"), big.NewInt(0), data)
	if err != nil {
		t.Error(err)
	}

	txHash, err := sm.SendSignedTransaction(tx)
	if err != nil{
		t.Error(err)
	}

	log.Println(txHash)
}
