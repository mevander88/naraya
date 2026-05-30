package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"naraya-api/internal/config"
	"naraya-api/internal/database"
)

func main() {
	cfg := config.Load()
	db, err := database.Connect(context.Background(), cfg.DatabaseURL, cfg.DBMaxConns, cfg.DBMinConns)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	ctx := context.Background()
	if _, err := db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS naraya_schema_migrations (
			filename TEXT PRIMARY KEY,
			checksum TEXT NOT NULL,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)
	`); err != nil {
		log.Fatal(err)
	}

	files, err := filepath.Glob("migrations/*.sql")
	if err != nil {
		log.Fatal(err)
	}
	sort.Strings(files)

	applied, err := appliedMigrations(ctx, db, files)
	if err != nil {
		log.Fatal(err)
	}

	for _, file := range files {
		sql, err := os.ReadFile(file)
		if err != nil {
			log.Fatal(err)
		}
		if strings.TrimSpace(string(sql)) == "" {
			continue
		}
		filename := filepath.Base(file)
		if applied[filename] {
			log.Printf("skipping %s", file)
			continue
		}
		log.Printf("applying %s", file)
		if _, err := db.Exec(ctx, string(sql)); err != nil {
			log.Fatal(err)
		}
		if _, err := db.Exec(ctx, `
			INSERT INTO naraya_schema_migrations (filename, checksum)
			VALUES ($1, $2)
			ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum
		`, filename, checksum(sql)); err != nil {
			log.Fatal(err)
		}
	}

	log.Println("migrations applied")
}

func appliedMigrations(ctx context.Context, db *pgxpool.Pool, files []string) (map[string]bool, error) {
	applied := make(map[string]bool)
	var existingSchema bool
	if err := db.QueryRow(ctx, `SELECT to_regclass('public.naraya_users') IS NOT NULL`).Scan(&existingSchema); err != nil {
		return nil, err
	}
	var appliedCount int
	if err := db.QueryRow(ctx, `SELECT count(*)::int FROM naraya_schema_migrations`).Scan(&appliedCount); err != nil {
		return nil, err
	}
	if appliedCount == 0 && existingSchema {
		for _, file := range files {
			sql, err := os.ReadFile(file)
			if err != nil {
				return nil, err
			}
			if strings.TrimSpace(string(sql)) == "" {
				continue
			}
			filename := filepath.Base(file)
			if filename >= baselineExistingSchemaBefore {
				continue
			}
			if _, err := db.Exec(ctx, `
				INSERT INTO naraya_schema_migrations (filename, checksum)
				VALUES ($1, $2)
				ON CONFLICT (filename) DO NOTHING
			`, filename, checksum(sql)); err != nil {
				return nil, err
			}
			applied[filename] = true
			log.Printf("baselined %s", file)
		}
		return applied, nil
	}

	rows, err := db.Query(ctx, `SELECT filename FROM naraya_schema_migrations`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var filename string
		if err := rows.Scan(&filename); err != nil {
			return nil, err
		}
		applied[filename] = true
	}
	return applied, rows.Err()
}

const baselineExistingSchemaBefore = "014_"

func checksum(content []byte) string {
	sum := sha256.Sum256(content)
	return hex.EncodeToString(sum[:])
}
