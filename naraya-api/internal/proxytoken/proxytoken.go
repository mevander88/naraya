package proxytoken

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"io"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

var errInvalidToken = errors.New("invalid proxy token")
var secretOnce sync.Once
var secretValue []byte
var ttlOnce sync.Once
var ttlValue time.Duration

func secret() []byte {
	secretOnce.Do(func() {
		value := strings.TrimSpace(os.Getenv("MEDIA_PROXY_SECRET"))
		if value != "" {
			secretValue = []byte(value)
			return
		}
		secretValue = make([]byte, 32)
		if _, err := rand.Read(secretValue); err != nil {
			panic(err)
		}
	})
	return secretValue
}

func Encode(raw string) string {
	return EncodeWithScope("", raw)
}

func EncodeWithScope(scope string, raw string) string {
	value := strings.TrimSpace(raw)
	scope = strings.TrimSpace(scope)
	expiresAt := time.Now().Add(tokenTTLForScope(scope)).Unix()
	plaintext := []byte(strconv.FormatInt(expiresAt, 10) + "|" + scope + "|" + value)
	block, err := aes.NewCipher(encryptionKey())
	if err != nil {
		panic(err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		panic(err)
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		panic(err)
	}
	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	return base64.RawURLEncoding.EncodeToString(ciphertext)
}

func Decode(token string) (string, error) {
	value, _, err := DecodeWithScope(token)
	return value, err
}

func DecodeWithScope(token string) (string, string, error) {
	rawToken := strings.TrimSpace(token)
	if rawToken == "" || strings.Contains(rawToken, ".") {
		return "", "", errInvalidToken
	}
	ciphertext, err := base64.RawURLEncoding.DecodeString(rawToken)
	if err != nil {
		return "", "", errInvalidToken
	}
	block, err := aes.NewCipher(encryptionKey())
	if err != nil {
		return "", "", errInvalidToken
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", "", errInvalidToken
	}
	if len(ciphertext) <= gcm.NonceSize() {
		return "", "", errInvalidToken
	}
	nonce := ciphertext[:gcm.NonceSize()]
	sealed := ciphertext[gcm.NonceSize():]
	plaintext, err := gcm.Open(nil, nonce, sealed, nil)
	if err != nil {
		return "", "", errInvalidToken
	}
	parts := strings.SplitN(string(plaintext), "|", 3)
	if len(parts) < 2 {
		return "", "", errInvalidToken
	}
	expiresRaw := parts[0]
	scope := ""
	value := parts[1]
	if len(parts) == 3 {
		scope = parts[1]
		value = parts[2]
	}
	expiresAt, err := strconv.ParseInt(expiresRaw, 10, 64)
	if err != nil || expiresAt < time.Now().Unix() || value == "" {
		return "", "", errInvalidToken
	}
	return value, scope, nil
}

func encryptionKey() []byte {
	sum := sha256.Sum256(secret())
	return sum[:]
}

func tokenTTL() time.Duration {
	ttlOnce.Do(func() {
		ttlValue = 2 * time.Hour
		if raw := strings.TrimSpace(os.Getenv("MEDIA_PROXY_TOKEN_TTL_SECONDS")); raw != "" {
			seconds, err := strconv.Atoi(raw)
			if err == nil && seconds >= 300 {
				ttlValue = time.Duration(seconds) * time.Second
			}
		}
	})
	return ttlValue
}

func tokenTTLForScope(scope string) time.Duration {
	if scope == "public-image" {
		return 7 * 24 * time.Hour
	}
	return tokenTTL()
}
