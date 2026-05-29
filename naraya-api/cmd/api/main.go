package main

import (
	"log"

	"naraya-api/internal/config"
	"naraya-api/internal/http"
)

func main() {
	cfg := config.Load()
	app := http.NewServer(cfg)

	log.Printf("Naraya API listening on %s", cfg.Addr)
	if err := app.Listen(cfg.Addr); err != nil {
		log.Fatal(err)
	}
}
