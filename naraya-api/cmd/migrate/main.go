package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"naraya-api/internal/config"
	"naraya-api/internal/database"
)

func main() {
	cfg := config.Load()
	db, err := database.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	files, err := filepath.Glob("migrations/*.sql")
	if err != nil {
		log.Fatal(err)
	}
	sort.Strings(files)

	for _, file := range files {
		sql, err := os.ReadFile(file)
		if err != nil {
			log.Fatal(err)
		}
		if strings.TrimSpace(string(sql)) == "" {
			continue
		}
		log.Printf("applying %s", file)
		if _, err := db.Exec(context.Background(), string(sql)); err != nil {
			log.Fatal(err)
		}
	}

	log.Println("migrations applied")
}
