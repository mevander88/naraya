package http

import (
	stdhttp "net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"naraya-api/internal/proxytoken"
	"naraya-api/internal/scraper"
)

type ComicHandler struct {
	service         *scraper.Service
	appAccessSecret string
}

var imageHTTPClient = stdhttp.Client{Timeout: 20 * time.Second}

func NewComicHandler(service *scraper.Service, appAccessSecret string) *ComicHandler {
	return &ComicHandler{service: service, appAccessSecret: strings.TrimSpace(appAccessSecret)}
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

func (h *ComicHandler) Sitemap(c *fiber.Ctx) error {
	c.Set("Cache-Control", "public, max-age=3600")
	result, err := h.service.SitemapCatalog(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(result)
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
	if !allowMediaRequest(c, h.appAccessSecret) {
		return fiber.NewError(fiber.StatusForbidden, "media request denied")
	}
	setPrivateMediaHeaders(c, "application/json")
	target, err := proxytoken.Decode(c.Params("token"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid video source token")
	}
	result, err := h.service.VideoSource(c.Context(), target)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(result)
}

func (h *ComicHandler) Image(c *fiber.Ctx) error {
	target, scope, err := proxytoken.DecodeWithScope(c.Params("token"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid image token")
	}
	publicImage := scope == "public-image"
	if !publicImage && !allowMediaRequest(c, h.appAccessSecret) {
		return fiber.NewError(fiber.StatusForbidden, "media request denied")
	}
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
	if publicImage {
		setPublicImageHeaders(c, contentType)
	} else {
		setPrivateMediaHeaders(c, contentType)
	}
	c.Set("Content-Disposition", `inline; filename="naraya-image"`)
	if length := res.Header.Get("Content-Length"); length != "" {
		c.Set("Content-Length", length)
	}
	return c.SendStream(res.Body)
}

func (h *ComicHandler) Video(c *fiber.Ctx) error {
	if !allowMediaRequest(c, h.appAccessSecret) {
		return fiber.NewError(fiber.StatusForbidden, "media request denied")
	}
	target, err := proxytoken.Decode(c.Params("token"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid video token")
	}
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
	setPrivateMediaHeaders(c, contentType)
	c.Set("Content-Disposition", `inline; filename="naraya-video"`)
	c.Set("Accept-Ranges", "bytes")
	if length := res.Header.Get("Content-Length"); length != "" {
		c.Set("Content-Length", length)
	}
	if contentRange := res.Header.Get("Content-Range"); contentRange != "" {
		c.Set("Content-Range", contentRange)
	}
	return c.SendStream(res.Body)
}

func setPrivateMediaHeaders(c *fiber.Ctx, contentType string) {
	c.Set("Content-Type", contentType)
	c.Set("Cache-Control", "private, no-store, max-age=0")
	c.Set("Pragma", "no-cache")
	c.Set("X-Content-Type-Options", "nosniff")
	c.Set("X-Robots-Tag", "noindex, nofollow, noarchive")
	c.Set("Referrer-Policy", "same-origin")
	c.Set("Cross-Origin-Resource-Policy", "same-origin")
}

func setPublicImageHeaders(c *fiber.Ctx, contentType string) {
	c.Set("Content-Type", contentType)
	c.Set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")
	c.Set("X-Content-Type-Options", "nosniff")
	c.Set("Referrer-Policy", "strict-origin-when-cross-origin")
	c.Set("Cross-Origin-Resource-Policy", "cross-origin")
}

func allowMediaRequest(c *fiber.Ctx, appAccessSecret string) bool {
	if validAppAccess(c, appAccessSecret) {
		return true
	}
	site := strings.ToLower(strings.TrimSpace(c.Get("Sec-Fetch-Site")))
	if site == "same-origin" || site == "same-site" {
		return true
	}
	return isAllowedMediaURL(c.Get("Origin")) || isAllowedMediaURL(c.Get("Referer"))
}

func isAllowedMediaURL(raw string) bool {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return false
	}
	parsed, err := url.Parse(raw)
	if err != nil {
		return false
	}
	host := strings.ToLower(parsed.Hostname())
	switch host {
	case "naraya.biz.id", "www.naraya.biz.id", "localhost", "127.0.0.1":
		return true
	default:
		return false
	}
}
