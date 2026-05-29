package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Addr        string
	SourceURL   string
	DatabaseURL string
	CORSOrigins string
	HTTPTimeout time.Duration
	CacheTTL    time.Duration
}

func Load() Config {
	return Config{
		Addr:        env("ADDR", ":4000"),
		SourceURL:   env("SOURCE_URL", "https://www.mynimeku.com"),
		DatabaseURL: env("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/naraya?sslmode=disable"),
		CORSOrigins: env("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://naraya.biz.id,https://www.naraya.biz.id"),
		HTTPTimeout: durationEnv("HTTP_TIMEOUT_SECONDS", 20) * time.Second,
		CacheTTL:    durationEnv("CACHE_TTL_SECONDS", 300) * time.Second,
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func durationEnv(key string, fallback int) time.Duration {
	value, err := strconv.Atoi(os.Getenv(key))
	if err != nil || value <= 0 {
		value = fallback
	}
	return time.Duration(value)
}
