package http

import (
	"encoding/base64"
	"net/url"
	"strings"

	"github.com/gofiber/fiber/v2"
	"naraya-api/internal/model"
	"naraya-api/internal/proxytoken"
	"naraya-api/internal/store"
)

type InternalHandler struct {
	store *store.Store
}

func NewInternalHandler(store *store.Store) *InternalHandler {
	return &InternalHandler{store: store}
}

func (h *InternalHandler) Register(c *fiber.Ctx) error {
	var req model.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid register payload")
	}
	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(req.Email)
	req.DisplayName = strings.TrimSpace(req.DisplayName)
	if req.Username == "" || req.Email == "" || req.DisplayName == "" || len(req.Password) < 8 {
		return fiber.NewError(fiber.StatusBadRequest, "username, email, displayName, and password are required")
	}
	user, err := h.store.CreateUser(c.UserContext(), req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	auth, err := h.store.CreateSession(c.UserContext(), user, c.Get("User-Agent"), c.IP())
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	setSessionCookies(c, auth)
	return c.Status(fiber.StatusCreated).JSON(auth)
}

func (h *InternalHandler) Login(c *fiber.Ctx) error {
	var req model.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid login payload")
	}
	if strings.TrimSpace(req.Identifier) == "" || req.Password == "" {
		return fiber.NewError(fiber.StatusBadRequest, "identifier and password are required")
	}
	auth, err := h.store.Login(c.UserContext(), req, c.Get("User-Agent"), c.IP())
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "invalid credentials")
	}
	setSessionCookies(c, auth)
	return c.JSON(auth)
}

func (h *InternalHandler) Logout(c *fiber.Ctx) error {
	token := sessionToken(c)
	if token == "" {
		return c.SendStatus(fiber.StatusNoContent)
	}
	if err := h.store.RevokeSession(c.UserContext(), token); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	clearSessionCookies(c)
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *InternalHandler) GetSettings(c *fiber.Ctx) error {
	id, err := h.resolvedUserID(c)
	if err != nil {
		return err
	}
	settings, err := h.store.GetSettings(c.UserContext(), id)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(settings)
}

func (h *InternalHandler) UpdateSettings(c *fiber.Ctx) error {
	id, err := h.resolvedUserID(c)
	if err != nil {
		return err
	}
	var req model.UpdateSettingsRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid settings payload")
	}
	settings, err := h.store.UpdateSettings(c.UserContext(), id, req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(settings)
}

func (h *InternalHandler) Me(c *fiber.Ctx) error {
	user, err := h.currentUser(c)
	if err != nil {
		return err
	}
	return c.JSON(user)
}

func (h *InternalHandler) UserStats(c *fiber.Ctx) error {
	id, err := h.resolvedUserID(c)
	if err != nil {
		return err
	}
	stats, err := h.store.UserStats(c.UserContext(), id)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(stats)
}

func (h *InternalHandler) ListLibrary(c *fiber.Ctx) error {
	id, err := h.resolvedUserID(c)
	if err != nil {
		return err
	}
	items, err := h.store.ListLibrary(c.UserContext(), id)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	normalizeLibraryItems(items)
	return c.JSON(fiber.Map{"items": items})
}

func (h *InternalHandler) UpsertLibrary(c *fiber.Ctx) error {
	var req model.UpsertLibraryRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid library payload")
	}
	id, err := h.resolvedUserID(c)
	if err != nil {
		return err
	}
	req.UserID = id
	if strings.TrimSpace(req.ComicSlug) == "" || strings.TrimSpace(req.ComicTitle) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "comicSlug and comicTitle are required")
	}
	req.CoverURL = normalizeLibraryMediaURL(req.CoverURL)
	req.ProgressPercent = clampProgress(req.ProgressPercent)
	item, err := h.store.UpsertLibrary(c.UserContext(), req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	item.CoverURL = normalizeLibraryMediaURL(item.CoverURL)
	return c.JSON(item)
}

func clampProgress(value int) int {
	if value < 0 {
		return 0
	}
	if value > 100 {
		return 100
	}
	return value
}

func normalizeLibraryItems(items []model.LibraryItem) {
	for i := range items {
		items[i].CoverURL = normalizeLibraryMediaURL(items[i].CoverURL)
		items[i].ProgressPercent = clampProgress(items[i].ProgressPercent)
	}
}

func normalizeLibraryMediaURL(value string) string {
	raw := strings.TrimSpace(value)
	if raw == "" {
		return ""
	}
	token, ok := imageProxyToken(raw)
	if !ok {
		return raw
	}
	if !strings.Contains(token, ".") {
		return "/api/images/" + token
	}
	target, ok := legacyImageTarget(token)
	if !ok || !allowedLegacyImageTarget(target) {
		return raw
	}
	return "/api/images/" + proxytoken.EncodeWithScope("public-image", target)
}

func imageProxyToken(value string) (string, bool) {
	const imagePrefix = "/api/images/"
	if strings.HasPrefix(value, imagePrefix) {
		return strings.Trim(strings.TrimPrefix(value, imagePrefix), "/"), true
	}
	parsed, err := url.Parse(value)
	if err != nil || parsed.Path == "" || !strings.HasPrefix(parsed.Path, imagePrefix) {
		return "", false
	}
	host := strings.ToLower(parsed.Hostname())
	if host != "naraya.biz.id" && host != "127.0.0.1" && host != "localhost" {
		return "", false
	}
	return strings.Trim(strings.TrimPrefix(parsed.Path, imagePrefix), "/"), true
}

func legacyImageTarget(token string) (string, bool) {
	payload, _, ok := strings.Cut(token, ".")
	if !ok || payload == "" {
		return "", false
	}
	decoded, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		return "", false
	}
	return strings.TrimSpace(string(decoded)), true
}

func allowedLegacyImageTarget(target string) bool {
	parsed, err := url.Parse(target)
	if err != nil {
		return false
	}
	scheme := strings.ToLower(parsed.Scheme)
	if scheme != "https" && scheme != "http" {
		return false
	}
	host := strings.ToLower(parsed.Hostname())
	return host == "mynimeku.com" ||
		host == "www.mynimeku.com" ||
		strings.HasSuffix(host, ".mynimeku.com") ||
		host == "image.mydriveku.my.id" ||
		strings.HasSuffix(host, ".mydriveku.my.id")
}

func (h *InternalHandler) DeleteLibrary(c *fiber.Ctx) error {
	id, err := h.resolvedUserID(c)
	if err != nil {
		return err
	}
	if err := h.store.DeleteLibrary(c.UserContext(), id, c.Params("comicSlug")); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *InternalHandler) LoveStatus(c *fiber.Ctx) error {
	targetSlug := strings.TrimSpace(c.Params("targetSlug"))
	status, err := h.store.LoveStatus(c.UserContext(), h.optionalUserID(c), targetSlug)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(status)
}

func (h *InternalHandler) ListMyLoves(c *fiber.Ctx) error {
	id, err := h.resolvedUserID(c)
	if err != nil {
		return err
	}
	items, err := h.store.ListUserLoves(c.UserContext(), id)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(fiber.Map{"items": items})
}

func (h *InternalHandler) CreateLove(c *fiber.Ctx) error {
	var req model.CreateLoveRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid love payload")
	}
	id, err := h.resolvedUserID(c)
	if err != nil {
		return err
	}
	req.UserID = id
	if strings.TrimSpace(req.TargetSlug) == "" || strings.TrimSpace(req.TargetTitle) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "targetSlug and targetTitle are required")
	}
	status, err := h.store.CreateLove(c.UserContext(), req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(status)
}

func (h *InternalHandler) ListComments(c *fiber.Ctx) error {
	comicSlug := strings.TrimSpace(c.Query("comicSlug"))
	chapterSlug := strings.TrimSpace(c.Query("chapterSlug"))
	if comicSlug == "" && chapterSlug == "" {
		return fiber.NewError(fiber.StatusBadRequest, "comicSlug or chapterSlug query is required")
	}
	comments, err := h.store.ListComments(c.UserContext(), comicSlug, chapterSlug, commentLimit(c), strings.TrimSpace(c.Query("cursor")))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(comments)
}

func (h *InternalHandler) ListMyComments(c *fiber.Ctx) error {
	id, err := h.resolvedUserID(c)
	if err != nil {
		return err
	}
	comments, err := h.store.ListUserComments(c.UserContext(), id, commentLimit(c), strings.TrimSpace(c.Query("cursor")))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(comments)
}

func (h *InternalHandler) CreateComment(c *fiber.Ctx) error {
	var req model.CreateCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid comment payload")
	}
	id, err := h.resolvedUserID(c)
	if err != nil {
		return err
	}
	req.UserID = id
	if strings.TrimSpace(req.Body) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "body is required")
	}
	if strings.TrimSpace(req.ComicSlug) == "" && strings.TrimSpace(req.ChapterSlug) == "" && strings.TrimSpace(req.ParentID) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "comicSlug, chapterSlug, or parentId is required")
	}
	comment, err := h.store.CreateComment(c.UserContext(), req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(comment)
}

func commentLimit(c *fiber.Ctx) int {
	limit := c.QueryInt("limit", 10)
	if limit < 1 {
		return 10
	}
	if limit > 50 {
		return 50
	}
	return limit
}
