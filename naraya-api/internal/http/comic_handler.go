package http

import (
	"encoding/base64"
	stdhttp "net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"naraya-api/internal/scraper"
)

type ComicHandler struct {
	service *scraper.Service
}

var imageHTTPClient = stdhttp.Client{Timeout: 20 * time.Second}

func NewComicHandler(service *scraper.Service) *ComicHandler {
	return &ComicHandler{service: service}
}

func (h *ComicHandler) Health(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=30")
	return c.JSON(fiber.Map{
		"status": "ok",
		"app":    "Naraya",
	})
}

func (h *ComicHandler) Latest(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=120")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	result, err := h.service.Latest(c.Context(), page)
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(result)
}

func (h *ComicHandler) Home(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=120")
	result, err := h.service.Home(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(result)
}

func (h *ComicHandler) LatestSeries(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=120")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	result, err := h.service.LatestSeries(c.Context(), page)
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(result)
}

func (h *ComicHandler) Catalog(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=3600")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	result, err := h.service.Catalog(c.Context(), page, c.Query("genre"), c.Query("type"), c.Query("status"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(result)
}

func (h *ComicHandler) AZCatalog(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=3600")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	result, err := h.service.AZCatalog(c.Context(), page, c.Query("letter"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(result)
}

func (h *ComicHandler) Search(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=120")
	result, err := h.service.Search(c.Context(), c.Query("q"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(result)
}

func (h *ComicHandler) Genres(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=3600")
	result, err := h.service.Genres(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(fiber.Map{"items": result})
}

func (h *ComicHandler) Navigation(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=3600")
	result, err := h.service.Navigation(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(fiber.Map{"items": result})
}

func (h *ComicHandler) Detail(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=300")
	result, err := h.service.Detail(c.Context(), c.Params("slug"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(result)
}

func (h *ComicHandler) Series(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=300")
	result, err := h.service.Series(c.Context(), c.Params("slug"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(result)
}

func (h *ComicHandler) Reader(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=300")
	result, err := h.service.Reader(c.Context(), c.Params("slug"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(result)
}

func (h *ComicHandler) Episode(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=300")
	result, err := h.service.Episode(c.Context(), c.Params("slug"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(result)
}

func (h *ComicHandler) VideoSource(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=300")
	result, err := h.service.VideoSource(c.Context(), c.Query("url"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(result)
}

func (h *ComicHandler) Image(c *fiber.Ctx) error {
	decoded, err := base64.RawURLEncoding.DecodeString(c.Params("token"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid image token")
	}
	target := string(decoded)
	if !strings.HasPrefix(target, "https://") && !strings.HasPrefix(target, "http://") {
		return fiber.NewError(fiber.StatusBadRequest, "invalid image target")
	}

	req, err := stdhttp.NewRequestWithContext(c.Context(), stdhttp.MethodGet, target, nil)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid image request")
	}
	req.Header.Set("User-Agent", "NarayaImageProxy/1.0")
	req.Header.Set("Accept", "image/avif,image/webp,image/*,*/*;q=0.8")
	res, err := imageHTTPClient.Do(req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, "image unavailable")
	}
	if res.StatusCode < 200 || res.StatusCode > 299 {
		res.Body.Close()
		return fiber.NewError(fiber.StatusBadGateway, "image unavailable")
	}
	contentType := res.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "image/jpeg"
	}
	c.Set("Content-Type", contentType)
	c.Set("Cache-Control", "public, max-age=604800, immutable")
	if length := res.Header.Get("Content-Length"); length != "" {
		c.Set("Content-Length", length)
	}
	return c.SendStream(res.Body)
}

func (h *ComicHandler) Video(c *fiber.Ctx) error {
	decoded, err := base64.RawURLEncoding.DecodeString(c.Params("token"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid video token")
	}
	target := string(decoded)
	if !strings.HasPrefix(target, "https://") && !strings.HasPrefix(target, "http://") {
		return fiber.NewError(fiber.StatusBadRequest, "invalid video target")
	}

	req, err := stdhttp.NewRequestWithContext(c.Context(), stdhttp.MethodGet, target, nil)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid video request")
	}
	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Accept", "video/mp4,video/*,*/*;q=0.8")
	req.Header.Set("Accept-Language", "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7")
	req.Header.Set("Referer", "https://players.myplayerku.my.id/")
	req.Header.Set("Origin", "https://players.myplayerku.my.id")
	req.Header.Set("Sec-Fetch-Dest", "video")
	req.Header.Set("Sec-Fetch-Mode", "cors")
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	if rangeHeader := c.Get("Range"); rangeHeader != "" {
		req.Header.Set("Range", rangeHeader)
	}

	res, err := imageHTTPClient.Do(req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, "video unavailable")
	}
	if res.StatusCode < 200 || res.StatusCode > 299 {
		res.Body.Close()
		return fiber.NewError(fiber.StatusBadGateway, "video unavailable")
	}

	contentType := res.Header.Get("Content-Type")
	if contentType == "" || strings.HasPrefix(contentType, "application/octet-stream") {
		contentType = "video/mp4"
	}
	c.Status(res.StatusCode)
	c.Set("Content-Type", contentType)
	c.Set("Content-Disposition", "inline")
	c.Set("Accept-Ranges", "bytes")
	c.Set("Cache-Control", "private, max-age=300")
	if length := res.Header.Get("Content-Length"); length != "" {
		c.Set("Content-Length", length)
	}
	if contentRange := res.Header.Get("Content-Range"); contentRange != "" {
		c.Set("Content-Range", contentRange)
	}
	return c.SendStream(res.Body)
}
