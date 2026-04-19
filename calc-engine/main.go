package main

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
)

type ProjectionRequest struct {
	Principal      float64 `json:"principal"`
	AnnualReturn   float64 `json:"annual_return"` // in percentage, e.g., 12 for 12%
	MonthlyDeposit float64 `json:"monthly_deposit"`
	Years          int     `json:"years"`
}

type YearlyData struct {
	Year  int     `json:"year"`
	Value float64 `json:"value"`
}

type ProjectionResponse struct {
	History []YearlyData `json:"history"`
}

func calculateProjections(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ProjectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	r_monthly := (req.AnnualReturn / 100) / 12
	months := req.Years * 12
	history := make([]YearlyData, 0)

	currentValue := req.Principal
	
	// Add year 0
	history = append(history, YearlyData{Year: 0, Value: math.Round(currentValue*100) / 100})

	for m := 1; m <= months; m++ {
		currentValue = currentValue*(1+r_monthly) + req.MonthlyDeposit
		if m%12 == 0 {
			history = append(history, YearlyData{
				Year:  m / 12,
				Value: math.Round(currentValue*100) / 100,
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(ProjectionResponse{History: history})
}

func main() {
	http.HandleFunc("/api/calculate", calculateProjections)
	fmt.Println("Calculation Engine running on port 8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		fmt.Printf("Server failed: %s\n", err)
	}
}
