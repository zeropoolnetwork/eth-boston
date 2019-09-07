package handlers

import (
	"log"

	"github.com/gin-gonic/gin"
)

type DepositData struct {
	SnarkProof [8]uint64 `json:"snarkProof"`
	Leaf       string    `json:"leaf"`
	Asset      string    `json:"asset"`
}

type WithdrawalData struct {
	RootHash        string    `json:"rootHash"`
	SnarkProof      [8]uint64 `json:"snarkProof"`
	Leaf            string    `json:"leaf"`
	FirstNullifier  uint      `json:"firstNullifier"`
	SecondNullifier uint      `json:"secondNullifier"`
	Asset           string    `json:"asset"`
	ToAddress       string    `json:"toAddress"`
}

type TransferData struct {
	RootHash        string    `json:"rootHash"`
	SnarkProof      [8]uint64 `json:"snarkProof"`
	FirstLeaf       string    `json:"firstLeaf"`
	SecondLeaf      string    `json:"secondLeaf"`
	FirstNullifier  uint      `json:"firstNullifier"`
	SecondNullifier uint      `json:"secondNullifier"`
}

func Deposit(c *gin.Context) {
	var dd DepositData

	err := c.BindJSON(&dd)
	if err != nil {
		log.Println(err)
		c.JSON(500, err)
		return
	}
}

func Withdrawal(c *gin.Context) {

	var wd WithdrawalData

	err := c.BindJSON(&wd)
	if err != nil {
		log.Println(err)
		c.JSON(500, err)
		return
	}

}

func Transfer(c *gin.Context) {
	var td TransferData

	err := c.BindJSON(&td)
	if err != nil {
		log.Println(err)
		c.JSON(500, err)
		return
	}
}
