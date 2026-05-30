package http

import (
	"context"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/etag"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"naraya-api/internal/config"
	"naraya-api/internal/database"
	"naraya-api/internal/model"
	"naraya-api/internal/scraper"
	"naraya-api/internal/store"
)

func NewServer(cfg config.Config) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "Naraya API",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	})

	app.Use(recover.New())
	app.Use(etag.New())
	app.Use(compress.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     "GET,POST,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,X-Naraya-Session,Authorization",
		AllowCredentials: true,
	}))

	client := scraper.NewClient(cfg.SourceURL, cfg.HTTPTimeout)
	service := scraper.NewService(
		client,
		scraper.NewCache[model.PagedComics](cfg.CacheTTL),
		scraper.NewCache[model.ComicDetail](cfg.CacheTTL),
		scraper.NewCache[model.ChapterReader](cfg.CacheTTL),
		scraper.NewCache[model.SeriesDetail](cfg.CacheTTL),
		scraper.NewCache[model.EpisodeReader](cfg.CacheTTL),
		scraper.NewCache[model.PagedCatalog](cfg.CacheTTL),
		scraper.NewCache[model.HomePayload](cfg.CacheTTL),
		scraper.NewCache[[]model.CatalogItem](cfg.CacheTTL),
		scraper.NewCache[[]model.MenuItem](cfg.CacheTTL),
	)
	handler := NewComicHandler(service)
	var internalHandler *InternalHandler
	db, err := database.Connect(context.Background(), cfg.DatabaseURL, cfg.DBMaxConns, cfg.DBMinConns)
	if err != nil {
		log.Printf("postgres disabled: %v", err)
	} else {
		internalHandler = NewInternalHandler(store.New(db))
	}

	api := app.Group("/api")
	api.Use(requireWebAccess(cfg))
	api.Get("/health", handler.Health)
	api.Get("/images/:token", handler.Image)
	api.Get("/videos/:token", handler.Video)
	api.Get("/video-source/:token", handler.VideoSource)
	api.Get("/home", handler.Home)
	api.Get("/navigation", handler.Navigation)
	api.Get("/sitemap", handler.Sitemap)
	api.Get("/search", handler.Search)
	api.Get("/genres", handler.Genres)
	api.Get("/comics/az", handler.AZCatalog)
	api.Get("/comics/catalog", handler.Catalog)
	api.Get("/comics/latest", handler.Latest)
	api.Get("/series/latest", handler.LatestSeries)
	api.Get("/series/:slug", handler.Series)
	api.Get("/episodes/:slug", handler.Episode)
	api.Get("/comics/:slug", handler.Detail)
	api.Get("/chapters/:slug", handler.Reader)
	if internalHandler != nil {
		api.Post("/auth/register", internalHandler.Register)
		api.Post("/auth/login", internalHandler.Login)
		api.Post("/auth/logout", internalHandler.Logout)
		api.Get("/me", internalHandler.Me)
		api.Get("/me/stats", internalHandler.UserStats)
		api.Get("/library", internalHandler.ListLibrary)
		api.Get("/library/:targetSlug/status", internalHandler.FavoriteStatus)
		api.Post("/library", internalHandler.UpsertLibrary)
		api.Delete("/library/:comicSlug", internalHandler.DeleteLibrary)
		api.Get("/loves/me", internalHandler.ListMyLoves)
		api.Get("/loves/:targetSlug", internalHandler.LoveStatus)
		api.Post("/loves", internalHandler.CreateLove)
		api.Get("/comments/me", internalHandler.ListMyComments)
		api.Get("/comments", internalHandler.ListComments)
		api.Post("/comments", internalHandler.CreateComment)
		api.Get("/settings", internalHandler.GetSettings)
		api.Patch("/settings", internalHandler.UpdateSettings)
	} else {
		api.All("/auth*", databaseUnavailable)
		api.All("/me", databaseUnavailable)
		api.All("/me/*", databaseUnavailable)
		api.All("/library*", databaseUnavailable)
		api.All("/loves*", databaseUnavailable)
		api.All("/comments*", databaseUnavailable)
		api.All("/settings*", databaseUnavailable)
	}

	return app
}

func databaseUnavailable(c *fiber.Ctx) error {
	return fiber.NewError(fiber.StatusServiceUnavailable, "postgres database is not connected")
}
