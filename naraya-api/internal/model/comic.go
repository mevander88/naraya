package model

type ComicCard struct {
	Slug          string   `json:"slug"`
	Title         string   `json:"title"`
	URL           string   `json:"-"`
	Cover         string   `json:"cover"`
	Type          string   `json:"type"`
	Status        string   `json:"status"`
	UpdatedAt     string   `json:"updatedAt"`
	SourceType    string   `json:"kind"`
	LatestChapter *Chapter `json:"latestChapter,omitempty"`
}

type Chapter struct {
	Slug   string `json:"slug"`
	Title  string `json:"title"`
	Number string `json:"number"`
	URL    string `json:"-"`
	Date   string `json:"date,omitempty"`
}

type ComicDetail struct {
	Slug        string    `json:"slug"`
	Title       string    `json:"title"`
	URL         string    `json:"-"`
	Cover       string    `json:"cover"`
	Description string    `json:"description"`
	Type        string    `json:"type"`
	Status      string    `json:"status"`
	Genres      []string  `json:"genres"`
	Info        []InfoRow `json:"info"`
	Chapters    []Chapter `json:"chapters"`
}

type ChapterReader struct {
	Slug      string   `json:"slug"`
	Title     string   `json:"title"`
	URL       string   `json:"-"`
	ComicURL  string   `json:"-"`
	ComicSlug string   `json:"comicSlug,omitempty"`
	Images    []string `json:"images"`
}

type SeriesEpisode struct {
	Slug   string `json:"slug"`
	Title  string `json:"title"`
	Number string `json:"number"`
	URL    string `json:"-"`
	Date   string `json:"date,omitempty"`
}

type SeriesDetail struct {
	Slug        string          `json:"slug"`
	Title       string          `json:"title"`
	URL         string          `json:"-"`
	Cover       string          `json:"cover"`
	Description string          `json:"description"`
	Genres      []string        `json:"genres"`
	Info        []InfoRow       `json:"info"`
	Episodes    []SeriesEpisode `json:"episodes"`
}

type InfoRow struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

type EpisodeServer struct {
	Type   string `json:"type"`
	Host   string `json:"host"`
	URL    string `json:"url"`
	Direct bool   `json:"direct,omitempty"`
}

type EpisodeDownload struct {
	Resolution string    `json:"resolution"`
	Links      []InfoRow `json:"links"`
}

type EpisodeReader struct {
	Slug       string            `json:"slug"`
	Title      string            `json:"title"`
	SeriesSlug string            `json:"seriesSlug,omitempty"`
	Cover      string            `json:"cover"`
	PlayerURL  string            `json:"playerUrl"`
	Servers    []EpisodeServer   `json:"servers"`
	Downloads  []EpisodeDownload `json:"downloads"`
}

type PagedComics struct {
	Page       int         `json:"page"`
	TotalPages int         `json:"totalPages"`
	Items      []ComicCard `json:"items"`
}

type HomePayload struct {
	Featured []ComicCard   `json:"featured"`
	Comics   []ComicCard   `json:"comics"`
	Series   []ComicCard   `json:"series"`
	Genres   []CatalogItem `json:"genres"`
}

type CatalogItem struct {
	Slug        string   `json:"slug"`
	URL         string   `json:"-"`
	Title       string   `json:"title,omitempty"`
	Cover       string   `json:"cover,omitempty"`
	Type        string   `json:"type,omitempty"`
	Status      string   `json:"status,omitempty"`
	Genres      []string `json:"genres,omitempty"`
	Description string   `json:"description,omitempty"`
	LastMod     string   `json:"lastMod"`
	SourceType  string   `json:"kind"`
	Count       string   `json:"count,omitempty"`
}

type PagedCatalog struct {
	Page       int           `json:"page"`
	TotalPages int           `json:"totalPages"`
	TotalItems string        `json:"totalItems,omitempty"`
	Items      []CatalogItem `json:"items"`
}

type MenuItem struct {
	Label    string     `json:"label"`
	Slug     string     `json:"slug,omitempty"`
	Path     string     `json:"path,omitempty"`
	Kind     string     `json:"kind,omitempty"`
	Children []MenuItem `json:"children,omitempty"`
}
