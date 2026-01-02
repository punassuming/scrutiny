package handler

import (
	"net/http"

	"github.com/analogj/scrutiny/webapp/backend/pkg/database"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func GetDevicesSummaryHealthHistory(c *gin.Context) {
	logger := c.MustGet("LOGGER").(*logrus.Entry)
	deviceRepo := c.MustGet("DEVICE_REPOSITORY").(database.DeviceRepo)

	durationKey, exists := c.GetQuery("duration_key")
	if !exists {
		durationKey = "week"
	}

	healthHistory, err := deviceRepo.GetSmartHealthHistory(c, durationKey)
	if err != nil {
		logger.Errorln("An error occurred while retrieving summary/health history", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"health_history": healthHistory,
		},
	})
}
