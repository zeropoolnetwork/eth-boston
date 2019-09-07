package main

import (
	"github.com/EnoRage/zeroPool/relayer/handlers"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.POST("/deposit", handlers.Deposit)
	r.POST("/withdrawal", handlers.Withdrawal)
	r.POST("/transfer", handlers.Transfer)

	r.Run(":80")
}
