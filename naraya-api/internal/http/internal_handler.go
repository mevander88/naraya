package http

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"naraya-api/internal/model"
	"naraya-api/internal/store"
)

const defaultUserID = "00000000-0000-0000-0000-000000000001"

type InternalHandler struct {
	store *store.Store
}

func NewInternalHandler(store *store.Store) *InternalHandler {
	return &InternalHandler{store: store}
}

func (h *InternalHandler) CreateUser(c *fiber.Ctx) error {
	var req model.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid user payload")
	}
	if strings.TrimSpace(req.Username) == "" || strings.TrimSpace(req.DisplayName) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "username and displayName are required")
	}
	if strings.TrimSpace(req.Email) == "" || len(req.Password) < 8 {
		return fiber.NewError(fiber.StatusBadRequest, "email and password with at least 8 characters are required")
	}
	user, err := h.store.CreateUser(c.UserContext(), req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(user)
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

func (h *InternalHandler) GetUser(c *fiber.Ctx) error {
	user, err := h.store.GetUser(c.UserContext(), c.Params("id"))
	if err != nil {
		if store.IsNotFound(err) {
			return fiber.NewError(fiber.StatusNotFound, "user not found")
		}
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(user)
}

func (h *InternalHandler) Me(c *fiber.Ctx) error {
	if token := sessionToken(c); token != "" {
		user, err := h.store.UserBySession(c.UserContext(), token)
		if err == nil {
			return c.JSON(user)
		}
	}
	user, err := h.store.GetUser(c.UserContext(), fallbackUserID(c))
	if err != nil {
		if store.IsNotFound(err) {
			return fiber.NewError(fiber.StatusNotFound, "user not found")
		}
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(user)
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
	return c.JSON(fiber.Map{"items": items})
}

func (h *InternalHandler) UpsertLibrary(c *fiber.Ctx) error {
	var req model.UpsertLibraryRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid library payload")
	}
	if strings.TrimSpace(req.UserID) == "" {
		id, err := h.resolvedUserID(c)
		if err != nil {
			return err
		}
		req.UserID = id
	}
	if strings.TrimSpace(req.ComicSlug) == "" || strings.TrimSpace(req.ComicTitle) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "comicSlug and comicTitle are required")
	}
	item, err := h.store.UpsertLibrary(c.UserContext(), req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(item)
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

func (h *InternalHandler) ListComments(c *fiber.Ctx) error {
	comicSlug := strings.TrimSpace(c.Query("comicSlug"))
	chapterSlug := strings.TrimSpace(c.Query("chapterSlug"))
	if comicSlug == "" && chapterSlug == "" {
		return fiber.NewError(fiber.StatusBadRequest, "comicSlug or chapterSlug query is required")
	}
	comments, err := h.store.ListComments(c.UserContext(), comicSlug, chapterSlug)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(fiber.Map{"items": comments})
}

func (h *InternalHandler) CreateComment(c *fiber.Ctx) error {
	var req model.CreateCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid comment payload")
	}
	if strings.TrimSpace(req.UserID) == "" {
		id, err := h.resolvedUserID(c)
		if err != nil {
			return err
		}
		req.UserID = id
	}
	if strings.TrimSpace(req.Body) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "body is required")
	}
	if strings.TrimSpace(req.ComicSlug) == "" && strings.TrimSpace(req.ChapterSlug) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "comicSlug or chapterSlug is required")
	}
	comment, err := h.store.CreateComment(c.UserContext(), req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(comment)
}

func (h *InternalHandler) resolvedUserID(c *fiber.Ctx) (string, error) {
	if token := sessionToken(c); token != "" {
		user, err := h.store.UserBySession(c.UserContext(), token)
		if err == nil {
			return user.ID, nil
		}
	}
	id := fallbackUserID(c)
	if id == defaultUserID && sessionToken(c) == "" {
		return id, nil
	}
	if strings.TrimSpace(id) == "" {
		return "", fiber.NewError(fiber.StatusUnauthorized, "login is required")
	}
	return id, nil
}

func fallbackUserID(c *fiber.Ctx) string {
	if value := strings.TrimSpace(c.Get("X-Naraya-User-ID")); value != "" {
		return value
	}
	if value := strings.TrimSpace(c.Query("userId")); value != "" {
		return value
	}
	return defaultUserID
}

func sessionToken(c *fiber.Ctx) string {
	if value := strings.TrimSpace(c.Get("X-Naraya-Session")); value != "" {
		return value
	}
	auth := strings.TrimSpace(c.Get("Authorization"))
	if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		return strings.TrimSpace(auth[7:])
	}
	if value := strings.TrimSpace(c.Query("session")); value != "" {
		return value
	}
	return ""
}
