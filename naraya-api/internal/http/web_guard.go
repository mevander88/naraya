package http

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"naraya-api/internal/config"
	"naraya-api/internal/proxytoken"
)

func requireWebAccess(cfg config.Config) fiber.Handler {
	secret := strings.TrimSpace(cfg.WebAccessSecret)
	internalToken := strings.TrimSpace(cfg.InternalToken)
	return func(c *fiber.Ctx) error {
		if c.Path() == "/api/health" || c.Method() == fiber.MethodOptions {
			return c.Next()
		}
		if internalToken != "" && hmac.Equal([]byte(c.Get("X-Naraya-Internal")), []byte(internalToken)) {
			return c.Next()
		}
		if isPublicImageRequest(c) {
			return c.Next()
		}
		if isLikelyBotUA(c.Get("User-Agent")) {
			return fiber.NewError(fiber.StatusForbidden, "api request denied")
		}
		if secret == "" || !hasValidWebContext(c) || !validWebToken(c.Cookies("naraya_web"), c.Get("User-Agent"), secret) {
			return fiber.NewError(fiber.StatusForbidden, "api request denied")
		}
		return c.Next()
	}
}

func isPublicImageRequest(c *fiber.Ctx) bool {
	if (c.Method() != fiber.MethodGet && c.Method() != fiber.MethodHead) || !strings.HasPrefix(c.Path(), "/api/images/") {
		return false
	}
	token := strings.Trim(strings.TrimPrefix(c.Path(), "/api/images/"), "/")
	_, scope, err := proxytoken.DecodeWithScope(token)
	return err == nil && scope == "public-image"
}

func hasValidWebContext(c *fiber.Ctx) bool {
	site := strings.ToLower(strings.TrimSpace(c.Get("Sec-Fetch-Site")))
	mode := strings.ToLower(strings.TrimSpace(c.Get("Sec-Fetch-Mode")))
	dest := strings.ToLower(strings.TrimSpace(c.Get("Sec-Fetch-Dest")))
	if (site == "same-origin" || site == "same-site") && dest != "document" {
		return true
	}
	if mode == "navigate" || dest == "document" {
		return false
	}
	return isAllowedMediaURL(c.Get("Origin")) || isAllowedMediaURL(c.Get("Referer"))
}

func validWebToken(token string, userAgent string, secret string) bool {
	parts := strings.Split(strings.TrimSpace(token), ".")
	if len(parts) != 4 {
		return false
	}
	expiresAt, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil || expiresAt < time.Now().Unix() {
		return false
	}
	if parts[1] != webUAHash(userAgent) {
		return false
	}
	expected := webSignature(parts[0], parts[1], parts[2], secret)
	return hmac.Equal([]byte(parts[3]), []byte(expected))
}

func webSignature(expiresAt string, uaHash string, nonce string, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(expiresAt + "|" + uaHash + "|" + nonce))
	return hex.EncodeToString(mac.Sum(nil))
}

func webUAHash(userAgent string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(userAgent)))
	return hex.EncodeToString(sum[:])[:24]
}

func isLikelyBotUA(userAgent string) bool {
	value := strings.ToLower(strings.TrimSpace(userAgent))
	if value == "" {
		return true
	}
	blocked := []string{
		"curl", "wget", "python-requests", "httpx", "aiohttp", "scrapy", "go-http-client",
		"java/", "okhttp", "httpclient", "libwww-perl", "node-fetch", "axios", "postmanruntime",
		"insomnia", "headlesschrome", "phantomjs", "selenium", "playwright",
	}
	for _, needle := range blocked {
		if strings.Contains(value, needle) {
			return true
		}
	}
	return false
}

func isAllowedWebURL(raw string) bool {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return false
	}
	parsed, err := url.Parse(raw)
	if err != nil {
		return false
	}
	host := strings.ToLower(parsed.Hostname())
	return host == "naraya.biz.id" || host == "www.naraya.biz.id" || host == "localhost" || host == "127.0.0.1"
}
