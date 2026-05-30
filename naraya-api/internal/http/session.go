package http

import (
	"net/url"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"naraya-api/internal/model"
	"naraya-api/internal/store"
)

func (h *InternalHandler) resolvedUserID(c *fiber.Ctx) (string, error) {
	user, err := h.currentUser(c)
	if err != nil {
		return "", err
	}
	return user.ID, nil
}

func (h *InternalHandler) currentUser(c *fiber.Ctx) (model.User, error) {
	token := sessionToken(c)
	if token == "" {
		return model.User{}, fiber.NewError(fiber.StatusUnauthorized, "login is required")
	}
	user, err := h.store.UserBySession(c.UserContext(), token)
	if err != nil {
		if store.IsNotFound(err) {
			return model.User{}, fiber.NewError(fiber.StatusUnauthorized, "login is required")
		}
		return model.User{}, fiber.NewError(fiber.StatusUnauthorized, "login is required")
	}
	return user, nil
}

func (h *InternalHandler) optionalUserID(c *fiber.Ctx) string {
	token := sessionToken(c)
	if token == "" {
		return ""
	}
	user, err := h.store.UserBySession(c.UserContext(), token)
	if err != nil {
		return ""
	}
	return user.ID
}

func sessionToken(c *fiber.Ctx) string {
	if value := strings.TrimSpace(c.Cookies("naraya_session")); value != "" {
		return value
	}
	if value := strings.TrimSpace(c.Get("X-Naraya-Session")); value != "" {
		return value
	}
	auth := strings.TrimSpace(c.Get("Authorization"))
	if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		return strings.TrimSpace(auth[7:])
	}
	return ""
}

func setSessionCookies(c *fiber.Ctx, auth model.AuthResponse) {
	secure := isSecureRequest(c)
	maxAge := int(time.Until(auth.ExpiresAt).Seconds())
	if maxAge < 0 {
		maxAge = 0
	}
	c.Cookie(&fiber.Cookie{
		Name:     "naraya_session",
		Value:    auth.Token,
		Path:     "/",
		HTTPOnly: true,
		Secure:   secure,
		SameSite: "Lax",
		MaxAge:   maxAge,
		Expires:  auth.ExpiresAt,
	})
	c.Cookie(&fiber.Cookie{
		Name:     "naraya_user",
		Value:    url.PathEscape(firstNonEmpty(auth.User.DisplayName, auth.User.Username)),
		Path:     "/",
		HTTPOnly: false,
		Secure:   secure,
		SameSite: "Lax",
		MaxAge:   maxAge,
		Expires:  auth.ExpiresAt,
	})
}

func clearSessionCookies(c *fiber.Ctx) {
	secure := isSecureRequest(c)
	for _, name := range []string{"naraya_session", "naraya_user"} {
		c.Cookie(&fiber.Cookie{
			Name:     name,
			Value:    "",
			Path:     "/",
			HTTPOnly: name == "naraya_session",
			Secure:   secure,
			SameSite: "Lax",
			MaxAge:   -1,
			Expires:  time.Unix(0, 0),
		})
	}
}

func isSecureRequest(c *fiber.Ctx) bool {
	if strings.EqualFold(c.Get("X-Forwarded-Proto"), "https") {
		return true
	}
	return c.Protocol() == "https"
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}
