package contract

import (
	"testing"
	"os"
	"math/big"
	"log"
)

func TestSend(t *testing.T){
	sm, err := ConnectContract("https://rinkeby.infura.io", "0x43218f7958c72a123cde8f56a3b5b604a934d455")
	if err != nil{
		t.Error(err)
		return
	}

	fp :=  big.NewInt(1)
	sp := [32]byte{}

	data, err := sm.GetDataByteCode("setData",fp,fp,fp,fp,fp,fp,fp,fp,sp,sp,sp,sp,sp,sp)
	if err != nil{
		t.Error(err)
		return
	}

	tx, err := sm.SignTransaction(os.Getenv("PRIVATE_KEY"), big.NewInt(20), data)
	if err != nil {
		t.Error(err)
		return
	}

	txHash, err := sm.SendSignedTransaction(tx)
	if err != nil{
		t.Error(err)
		return
	}

	log.Println(txHash)
}
