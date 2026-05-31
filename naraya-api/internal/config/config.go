package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Addr            string
	SourceURL       string
	DatabaseURL     string
	DBMaxConns      int
	DBMinConns      int
	CORSOrigins     string
	WebAccessSecret string
	AppAccessSecret string
	InternalToken   string
	HTTPTimeout     time.Duration
	CacheTTL        time.Duration
}

func Load() Config {
	return Config{
		Addr:            env("ADDR", ":4000"),
		SourceURL:       env("SOURCE_URL", "https://www.mynimeku.com"),
		DatabaseURL:     env("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/naraya?sslmode=disable"),
		DBMaxConns:      intEnv("DB_MAX_CONNS", 25),
		DBMinConns:      intEnv("DB_MIN_CONNS", 2),
		CORSOrigins:     env("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://naraya.biz.id,https://www.naraya.biz.id"),
		WebAccessSecret: env("WEB_ACCESS_SECRET", env("MEDIA_PROXY_SECRET", "")),
		AppAccessSecret: env("NARAYA_APP_ACCESS_SECRET", env("WEB_ACCESS_SECRET", env("MEDIA_PROXY_SECRET", ""))),
		InternalToken:   env("NARAYA_INTERNAL_TOKEN", ""),
		HTTPTimeout:     durationEnv("HTTP_TIMEOUT_SECONDS", 20) * time.Second,
		CacheTTL:        durationEnv("CACHE_TTL_SECONDS", 300) * time.Second,
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func intEnv(key string, fallback int) int {
	value, err := strconv.Atoi(os.Getenv(key))
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}

func durationEnv(key string, fallback int) time.Duration {
	value, err := strconv.Atoi(os.Getenv(key))
	if err != nil || value <= 0 {
		value = fallback
	}
	return time.Duration(value)
}
