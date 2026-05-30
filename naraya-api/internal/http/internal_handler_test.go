package http

import (
	"encoding/base64"
	"strings"
	"testing"

	"naraya-api/internal/proxytoken"
)

func TestNormalizeLibraryMediaURLConvertsLegacyNarayaImageURL(t *testing.T) {
	t.Setenv("MEDIA_PROXY_SECRET", "test-media-secret")
	target := "https://www.mynimeku.com/wp-content/uploads/2026/04/156390I.jpg"
	legacyToken := base64.RawURLEncoding.EncodeToString([]byte(target)) + ".legacyhash"

	normalized := normalizeLibraryMediaURL("https://naraya.biz.id/api/images/" + legacyToken)
	if !strings.HasPrefix(normalized, "/api/images/") {
		t.Fatalf("expected proxied image path, got %q", normalized)
	}

	token := strings.TrimPrefix(normalized, "/api/images/")
	if strings.Contains(token, ".") {
		t.Fatalf("expected new proxy token format without legacy separator, got %q", token)
	}

	value, scope, err := proxytoken.DecodeWithScope(token)
	if err != nil {
		t.Fatalf("expected normalized token to decode: %v", err)
	}
	if value != target {
		t.Fatalf("expected target %q, got %q", target, value)
	}
	if scope != "public-image" {
		t.Fatalf("expected public-image scope, got %q", scope)
	}
}

func TestNormalizeLibraryMediaURLConvertsPrivateImageToken(t *testing.T) {
	t.Setenv("MEDIA_PROXY_SECRET", "test-media-secret")
	target := "https://www.mynimeku.com/wp-content/uploads/2026/04/private-cover.jpg"
	privateToken := proxytoken.EncodeWithScope("reader-image", target)

	normalized := normalizeLibraryMediaURL("/api/images/" + privateToken)
	if !strings.HasPrefix(normalized, "/api/images/") {
		t.Fatalf("expected proxied image path, got %q", normalized)
	}

	token := strings.TrimPrefix(normalized, "/api/images/")
	if token == privateToken {
		t.Fatalf("expected private image token to be reissued as public-image")
	}

	value, scope, err := proxytoken.DecodeWithScope(token)
	if err != nil {
		t.Fatalf("expected normalized token to decode: %v", err)
	}
	if value != target {
		t.Fatalf("expected target %q, got %q", target, value)
	}
	if scope != "public-image" {
		t.Fatalf("expected public-image scope, got %q", scope)
	}
}

func TestNormalizeLibraryMediaURLKeepsNonProxyURL(t *testing.T) {
	raw := "https://example.com/cover.jpg"
	if normalized := normalizeLibraryMediaURL(raw); normalized != raw {
		t.Fatalf("expected non-proxy URL to stay unchanged, got %q", normalized)
	}
}
