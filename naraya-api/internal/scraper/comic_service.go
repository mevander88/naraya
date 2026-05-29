package scraper

import (
	"context"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"naraya-api/internal/model"
)

type Service struct {
	client       *Client
	latestCache  *Cache[model.PagedComics]
	detailCache  *Cache[model.ComicDetail]
	readerCache  *Cache[model.ChapterReader]
	catalogCache *Cache[model.PagedCatalog]
	homeCache    *Cache[model.HomePayload]
	genreCache   *Cache[[]model.CatalogItem]
	menuCache    *Cache[[]model.MenuItem]
}

func NewService(client *Client, latest *Cache[model.PagedComics], detail *Cache[model.ComicDetail], reader *Cache[model.ChapterReader], catalog *Cache[model.PagedCatalog], home *Cache[model.HomePayload], genres *Cache[[]model.CatalogItem], menu *Cache[[]model.MenuItem]) *Service {
	return &Service{
		client:       client,
		latestCache:  latest,
		detailCache:  detail,
		readerCache:  reader,
		catalogCache: catalog,
		homeCache:    home,
		genreCache:   genres,
		menuCache:    menu,
	}
}

func (s *Service) Latest(ctx context.Context, page int) (model.PagedComics, error) {
	if page < 1 {
		page = 1
	}
	key := fmt.Sprintf("latest:%d", page)
	if cached, ok := s.latestCache.Get(key); ok {
		return cached, nil
	}

	path := "/latest-komik/"
	if page > 1 {
		path = fmt.Sprintf("/latest-komik/page/%d/", page)
	}
	doc, _, err := s.client.getDocument(ctx, path)
	if err != nil {
		return model.PagedComics{}, err
	}

	result := model.PagedComics{
		Page:       page,
		TotalPages: extractTotalPages(doc),
		Items:      parseLatestCards(doc, s.client),
	}
	s.latestCache.Set(key, result)
	return result, nil
}

func (s *Service) LatestSeries(ctx context.Context, page int) (model.PagedComics, error) {
	if page < 1 {
		page = 1
	}
	key := fmt.Sprintf("latest-series:%d", page)
	if cached, ok := s.latestCache.Get(key); ok {
		return cached, nil
	}

	path := "/latest-series/"
	if page > 1 {
		path = fmt.Sprintf("/latest-series/page/%d/", page)
	}
	doc, _, err := s.client.getDocument(ctx, path)
	if err != nil {
		return model.PagedComics{}, err
	}

	result := model.PagedComics{
		Page:       page,
		TotalPages: extractTotalPages(doc),
		Items:      parseLatestCards(doc, s.client),
	}
	s.latestCache.Set(key, result)
	return result, nil
}

func (s *Service) Home(ctx context.Context) (model.HomePayload, error) {
	if cached, ok := s.homeCache.Get("home"); ok {
		return cached, nil
	}
	homeDoc, _, err := s.client.getDocument(ctx, "/")
	if err != nil {
		return model.HomePayload{}, err
	}
	comics := make([]model.ComicCard, 0)
	series := make([]model.ComicCard, 0)
	for page := 1; page <= 3; page++ {
		result, err := s.Latest(ctx, page)
		if err != nil {
			return model.HomePayload{}, err
		}
		comics = append(comics, result.Items...)
	}
	for page := 1; page <= 2; page++ {
		result, err := s.LatestSeries(ctx, page)
		if err != nil {
			return model.HomePayload{}, err
		}
		series = append(series, result.Items...)
	}
	genres, err := s.Genres(ctx)
	if err != nil {
		return model.HomePayload{}, err
	}
	result := model.HomePayload{
		Featured: dedupeComicCards(parseHomeWidgetCards(homeDoc, s.client)),
		Comics:   dedupeComicCards(comics),
		Series:   dedupeComicCards(series),
		Genres:   genres,
	}
	s.homeCache.Set("home", result)
	return result, nil
}

func (s *Service) Detail(ctx context.Context, slug string) (model.ComicDetail, error) {
	slug = strings.Trim(slug, "/ ")
	if slug == "" {
		return model.ComicDetail{}, fmt.Errorf("slug is required")
	}
	if cached, ok := s.detailCache.Get(slug); ok {
		return cached, nil
	}

	doc, target, err := s.client.getDocument(ctx, "/komik/"+slug+"/")
	if err != nil {
		return model.ComicDetail{}, err
	}

	detail := model.ComicDetail{
		Slug:        slug,
		URL:         target,
		Title:       metaContent(doc, "property", "og:title"),
		Cover:       assetProxyURL(metaContent(doc, "property", "og:image")),
		Description: parseSeriesDescription(doc),
		Info:        parseSeriesInfo(doc),
		Chapters:    parseChapters(doc, s.client),
	}
	if detail.Description == "" {
		detail.Description = metaContent(doc, "name", "description")
	}
	detail.Title = strings.TrimSuffix(detail.Title, " - MyNimeku")
	parseDetailBadges(doc, &detail)
	parseGenres(doc, &detail)

	s.detailCache.Set(slug, detail)
	return detail, nil
}

func (s *Service) Series(ctx context.Context, slug string) (model.SeriesDetail, error) {
	slug = strings.Trim(slug, "/ ")
	if slug == "" {
		return model.SeriesDetail{}, fmt.Errorf("slug is required")
	}
	doc, target, err := s.client.getDocument(ctx, "/series/"+slug+"/")
	if err != nil {
		return model.SeriesDetail{}, err
	}
	detail := model.SeriesDetail{
		Slug:        slug,
		URL:         target,
		Title:       strings.TrimSuffix(metaContent(doc, "property", "og:title"), " - MyNimeku"),
		Cover:       assetProxyURL(metaContent(doc, "property", "og:image")),
		Description: parseSeriesDescription(doc),
		Genres:      parseSeriesGenres(doc),
		Info:        parseSeriesInfo(doc),
		Episodes:    parseSeriesEpisodes(doc, s.client),
	}
	if detail.Description == "" {
		detail.Description = metaContent(doc, "name", "description")
	}
	return detail, nil
}

func (s *Service) Episode(ctx context.Context, slug string) (model.EpisodeReader, error) {
	slug = strings.Trim(slug, "/ ")
	if slug == "" {
		return model.EpisodeReader{}, fmt.Errorf("slug is required")
	}
	doc, _, err := s.client.getDocument(ctx, "/episode/"+slug+"/")
	if err != nil {
		return model.EpisodeReader{}, err
	}
	servers := parseEpisodeServers(doc)
	reader := model.EpisodeReader{
		Slug:       slug,
		Title:      strings.TrimSuffix(metaContent(doc, "property", "og:title"), " - MyNimeku"),
		Cover:      assetProxyURL(metaContent(doc, "property", "og:image")),
		SeriesSlug: parseEpisodeSeriesSlug(doc, s.client),
		Servers:    servers,
		Downloads:  parseEpisodeDownloads(doc),
	}
	if len(reader.Servers) > 0 {
		reader.PlayerURL = reader.Servers[0].URL
	}
	return reader, nil
}

func (s *Service) VideoSource(ctx context.Context, playerURL string) (model.EpisodeServer, error) {
	playerURL = strings.TrimSpace(playerURL)
	if playerURL == "" {
		return model.EpisodeServer{}, fmt.Errorf("player url is required")
	}
	result := model.EpisodeServer{URL: playerURL}
	directURL, ok := s.resolveEpisodeDirectVideo(ctx, playerURL)
	if !ok {
		return result, nil
	}
	result.URL = videoProxyURL(directURL)
	result.Direct = true
	return result, nil
}

func (s *Service) Catalog(ctx context.Context, page int, genre string, comicType string, status string) (model.PagedCatalog, error) {
	if page < 1 {
		page = 1
	}
	genre = slugifyFilter(genre)
	comicType = strings.ToUpper(strings.TrimSpace(comicType))
	status = slugifyFilter(status)
	key := fmt.Sprintf("catalog:%d:%s:%s:%s", page, genre, comicType, status)
	if cached, ok := s.catalogCache.Get(key); ok {
		return cached, nil
	}

	path := catalogPath(page, genre, comicType, status)
	doc, _, err := s.client.getDocument(ctx, path)
	if err != nil {
		return model.PagedCatalog{}, err
	}
	result := model.PagedCatalog{
		Page:       page,
		TotalPages: extractTotalPagesFromSelector(doc, ".mynimeku-mix-feed__pagination a, .mynimeku-mix-feed__pagination span"),
		Items:      parseMixCatalog(doc, s.client),
	}
	s.catalogCache.Set(key, result)
	return result, nil
}

func (s *Service) AZCatalog(ctx context.Context, page int, letter string) (model.PagedCatalog, error) {
	if page < 1 {
		page = 1
	}
	letter = slugifyAZLetter(letter)
	key := fmt.Sprintf("az:%d:%s", page, letter)
	if cached, ok := s.catalogCache.Get(key); ok {
		return cached, nil
	}

	path := "/a-z-list/"
	if letter != "" && letter != "all" {
		path = fmt.Sprintf("/a-z-list/abjad/%s/", letter)
	}
	if page > 1 {
		path = strings.TrimRight(path, "/") + fmt.Sprintf("/page/%d/", page)
	}
	doc, _, err := s.client.getDocument(ctx, path)
	if err != nil {
		return model.PagedCatalog{}, err
	}
	result := model.PagedCatalog{
		Page:       page,
		TotalPages: extractTotalPagesFromSelector(doc, ".mynimeku-az-feed__pagination a, .mynimeku-az-feed__pagination span, .page-numbers, .pagination a, .pagination span, .nav-links a, .nav-links span"),
		TotalItems: extractAZTotalItems(doc),
		Items:      parseAZCatalog(doc, s.client),
	}
	s.catalogCache.Set(key, result)
	return result, nil
}

func slugifyAZLetter(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" || value == "all" {
		return "all"
	}
	if value == "&" || value == "sym" {
		return "sym"
	}
	if len(value) == 1 && ((value[0] >= 'a' && value[0] <= 'z') || (value[0] >= '0' && value[0] <= '9')) {
		return value
	}
	return "all"
}

func catalogPath(page int, genre string, comicType string, status string) string {
	types := "MANGA,MANHUA,MANHWA,DOUJINSHI,ONE-SHOT"
	if comicType != "" && comicType != "ALL" {
		types = comicType
	}
	parts := []string{"o:modified", "t:" + types}
	if status != "" && status != "all" {
		parts = append(parts, "s:"+status)
	}
	if genre != "" && genre != "all" {
		parts = append(parts, "g:"+genre)
	}
	base := "/full-list/mix/" + strings.Join(parts, "~") + "/"
	if page > 1 {
		return strings.TrimRight(base, "/") + fmt.Sprintf("/page/%d/", page)
	}
	return base
}

func slugifyFilter(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	value = strings.ReplaceAll(value, "_", "-")
	value = strings.ReplaceAll(value, " ", "-")
	return value
}

func (s *Service) Search(ctx context.Context, query string) (model.PagedCatalog, error) {
	query = strings.TrimSpace(query)
	if len(query) < 2 {
		return model.PagedCatalog{Page: 1, TotalPages: 1, Items: []model.CatalogItem{}}, nil
	}
	key := "search:" + strings.ToLower(query)
	if cached, ok := s.catalogCache.Get(key); ok {
		return cached, nil
	}

	path := "/?s=" + url.QueryEscape(query)
	doc, _, err := s.client.getDocument(ctx, path)
	if err != nil {
		return model.PagedCatalog{}, err
	}
	result := model.PagedCatalog{
		Page:       1,
		TotalPages: extractTotalPagesFromSelector(doc, ".mynimeku-search-feed__pagination a, .mynimeku-search-feed__pagination span, .page-numbers"),
		Items:      parseSearchCatalog(doc, s.client),
	}
	if len(result.Items) > 8 {
		result.Items = result.Items[:8]
	}
	s.catalogCache.Set(key, result)
	return result, nil
}

func (s *Service) Genres(ctx context.Context) ([]model.CatalogItem, error) {
	if cached, ok := s.genreCache.Get("genres"); ok {
		return cached, nil
	}
	doc, _, err := s.client.getDocument(ctx, "/genre-list/")
	if err != nil {
		return nil, err
	}
	items := parseGenreList(doc, s.client)
	s.genreCache.Set("genres", items)
	return items, nil
}

func (s *Service) Navigation(ctx context.Context) ([]model.MenuItem, error) {
	if cached, ok := s.menuCache.Get("navigation"); ok {
		return cached, nil
	}
	doc, _, err := s.client.getDocument(ctx, "/")
	if err != nil {
		return nil, err
	}
	items := parseNavigation(doc, s.client)
	s.menuCache.Set("navigation", items)
	return items, nil
}

func (s *Service) SitemapCatalog(ctx context.Context) (model.PagedCatalog, error) {
	if cached, ok := s.catalogCache.Get("sitemap:catalog"); ok {
		return cached, nil
	}
	body, _, err := s.client.getBytes(ctx, "/sitemap_index.xml")
	if err != nil {
		return model.PagedCatalog{}, err
	}
	var index sitemapIndex
	if err := xml.Unmarshal(body, &index); err != nil {
		return model.PagedCatalog{}, err
	}

	seen := map[string]bool{}
	items := make([]model.CatalogItem, 0)
	for _, entry := range index.Sitemaps {
		loc := strings.TrimSpace(entry.Loc)
		if loc == "" || !isCatalogSitemap(loc) {
			continue
		}
		pageItems, err := s.parseURLSet(ctx, loc, "")
		if err != nil {
			continue
		}
		for _, item := range pageItems {
			if item.URL == "" || seen[item.URL] {
				continue
			}
			sourceType := catalogSourceType(item.URL)
			if sourceType == "" {
				continue
			}
			item.SourceType = sourceType
			seen[item.URL] = true
			items = append(items, item)
		}
	}

	result := model.PagedCatalog{
		Page:       1,
		TotalPages: 1,
		TotalItems: strconv.Itoa(len(items)),
		Items:      items,
	}
	s.catalogCache.Set("sitemap:catalog", result)
	return result, nil
}

func (s *Service) Reader(ctx context.Context, slug string) (model.ChapterReader, error) {
	slug = strings.Trim(slug, "/ ")
	if slug == "" {
		return model.ChapterReader{}, fmt.Errorf("slug is required")
	}
	if cached, ok := s.readerCache.Get(slug); ok {
		return cached, nil
	}

	doc, target, err := s.client.getDocument(ctx, "/chapter/"+slug+"/")
	if err != nil {
		return model.ChapterReader{}, err
	}

	reader := model.ChapterReader{
		Slug:   slug,
		URL:    target,
		Title:  strings.TrimSuffix(metaContent(doc, "property", "og:title"), " - MyNimeku"),
		Images: parseReaderImages(doc, s.client),
	}
	if restImages, err := s.readerImagesFromREST(ctx, doc); err == nil && len(restImages) > 0 {
		reader.Images = restImages
	}
	doc.Find(`script[type="application/ld+json"]`).EachWithBreak(func(_ int, sel *goquery.Selection) bool {
		text := sel.Text()
		re := regexp.MustCompile(`https:\\/\\/www\.mynimeku\.com\\/komik\\/[^"]+\\/`)
		if match := re.FindString(text); match != "" {
			reader.ComicURL = strings.ReplaceAll(match, `\/`, `/`)
			reader.ComicSlug = slugFromURL(reader.ComicURL)
			return false
		}
		return true
	})
	if reader.ComicSlug == "" {
		doc.Find(`a[href*="/komik/"]`).EachWithBreak(func(_ int, link *goquery.Selection) bool {
			href := s.client.absolute(attrAny(link, "href"))
			if strings.Contains(href, "/komik/") {
				reader.ComicURL = href
				reader.ComicSlug = slugFromURL(href)
				return false
			}
			return true
		})
	}

	s.readerCache.Set(slug, reader)
	return reader, nil
}

func parseLatestCards(doc *goquery.Document, client *Client) []model.ComicCard {
	items := make([]model.ComicCard, 0)
	doc.Find(".mynimeku-update-feed__item").Each(func(_ int, card *goquery.Selection) {
		series := card.Find(".mynimeku-update-feed__series-title").First()
		url := client.absolute(attrAny(series, "href"))
		sourceType := catalogSourceType(url)
		title := cleanText(series.Text())
		if url == "" || title == "" || sourceType == "" {
			return
		}

		badges := card.Find(".mynimeku-update-feed__badge")
		latest := card.Find(".mynimeku-update-feed__latest-link").First()
		latestURL := client.absolute(attrAny(latest, "href"))
		chapterTitle := cleanText(latest.Find(".mynimeku-update-feed__latest-pill").Text())
		chapter := &model.Chapter{
			Slug:   slugFromURL(latestURL),
			Title:  chapterTitle,
			Number: chapterNumber(chapterTitle),
			URL:    latestURL,
		}
		if latestURL == "" {
			chapter = nil
		}

		cardType := cleanText(badges.Eq(0).Text())
		if cardType == "" && sourceType == "series" {
			cardType = "Anime"
		}
		items = append(items, model.ComicCard{
			Slug:          slugFromURL(url),
			Title:         title,
			URL:           url,
			Cover:         assetProxyURL(client.absolute(attrAny(card.Find(".mynimeku-update-feed__cover img").First(), "data-lazy-src", "src"))),
			Type:          cardType,
			Status:        cleanText(badges.Eq(1).Text()),
			UpdatedAt:     cleanText(card.Find(".mynimeku-update-feed__date").First().Text()),
			SourceType:    sourceType,
			LatestChapter: chapter,
		})
	})
	return items
}

func dedupeComicCards(items []model.ComicCard) []model.ComicCard {
	seen := map[string]bool{}
	result := make([]model.ComicCard, 0, len(items))
	for _, item := range items {
		key := item.SourceType + ":" + item.Slug
		if item.Slug == "" || seen[key] {
			continue
		}
		seen[key] = true
		result = append(result, item)
	}
	return result
}

func parseSearchCatalog(doc *goquery.Document, client *Client) []model.CatalogItem {
	items := make([]model.CatalogItem, 0)
	seen := map[string]bool{}
	doc.Find(".mynimeku-search-feed__item").Each(func(_ int, card *goquery.Selection) {
		link := card.Find(".mynimeku-search-feed__series-title[href], .mynimeku-search-feed__cover[href]").First()
		rawURL := client.absolute(attrAny(link, "href"))
		sourceType := catalogSourceType(rawURL)
		if sourceType == "" || seen[rawURL] {
			return
		}
		title := cleanText(card.Find(".mynimeku-search-feed__series-title").First().Text())
		if title == "" {
			title = cleanText(card.Find(".mynimeku-search-feed__cover").First().AttrOr("aria-label", ""))
		}
		if title == "" {
			return
		}
		seen[rawURL] = true
		genres := make([]string, 0)
		card.Find(".mynimeku-search-feed__genre, a[href*='/genre/']").Each(func(_ int, genre *goquery.Selection) {
			value := cleanText(genre.Text())
			if value != "" {
				genres = append(genres, value)
			}
		})
		itemType := cleanText(card.Find(".mynimeku-search-feed__type").First().Text())
		if itemType == "" {
			if sourceType == "series" {
				itemType = "Anime"
			} else {
				itemType = "MANGA"
			}
		}
		items = append(items, model.CatalogItem{
			Slug:        slugFromURL(rawURL),
			URL:         rawURL,
			Title:       title,
			Cover:       assetProxyURL(client.absolute(attrAny(card.Find(".mynimeku-search-feed__cover img").First(), "data-lazy-src", "data-src", "src"))),
			Type:        itemType,
			Status:      cleanText(card.Find(".mynimeku-search-feed__status").First().Text()),
			Genres:      genres,
			Description: cleanText(card.Find(".mynimeku-search-feed__excerpt, .mynimeku-search-feed__synopsis").First().Text()),
			SourceType:  sourceType,
		})
	})
	return items
}

func parseHomeWidgetCards(doc *goquery.Document, client *Client) []model.ComicCard {
	groups := make([][]model.ComicCard, 0)
	doc.Find(".mynimeku-update-widget").Each(func(_ int, widget *goquery.Selection) {
		group := make([]model.ComicCard, 0)
		widget.Find(".mynimeku-update-widget__item").Each(func(_ int, card *goquery.Selection) {
			item, ok := parseHomeWidgetCard(card, client)
			if ok {
				group = append(group, item)
			}
		})
		if len(group) > 0 {
			groups = append(groups, group)
		}
	})
	return interleaveComicCardGroups(groups)
}

func parseHomeWidgetCard(card *goquery.Selection, client *Client) (model.ComicCard, bool) {
	link := card.Find(".mynimeku-update-widget__series-title[href], .mynimeku-update-widget__cover[href]").First()
	rawURL := client.absolute(attrAny(link, "href"))
	sourceType := catalogSourceType(rawURL)
	title := cleanText(card.Find(".mynimeku-update-widget__series-title").First().Text())
	if title == "" {
		title = cleanText(card.Find(".mynimeku-update-widget__cover").First().AttrOr("aria-label", ""))
	}
	if rawURL == "" || sourceType == "" || title == "" {
		return model.ComicCard{}, false
	}

	latest := card.Find(".mynimeku-update-widget__latest-link[href]").First()
	latestURL := client.absolute(attrAny(latest, "href"))
	latestTitle := firstNonEmpty(cleanText(latest.Find(".mynimeku-update-widget__latest-pill").First().AttrOr("title", "")), cleanText(latest.Find(".mynimeku-update-widget__latest-pill").First().Text()))
	var chapter *model.Chapter
	if latestURL != "" {
		chapter = &model.Chapter{
			Slug:   slugFromURL(latestURL),
			Title:  latestTitle,
			Number: chapterNumber(latestTitle),
			URL:    latestURL,
		}
	}

	cardType := cleanText(card.Find(".mynimeku-update-widget__type").First().Text())
	if cardType == "" && sourceType == "series" {
		cardType = "Anime"
	}
	return model.ComicCard{
		Slug:          slugFromURL(rawURL),
		Title:         title,
		URL:           rawURL,
		Cover:         assetProxyURL(client.absolute(attrAny(card.Find(".mynimeku-update-widget__cover img").First(), "data-lazy-src", "data-src", "src"))),
		Type:          cardType,
		Status:        cleanText(card.Find(".mynimeku-update-widget__status").First().Text()),
		UpdatedAt:     cleanText(card.Find(".mynimeku-update-widget__new").First().Text()),
		SourceType:    sourceType,
		LatestChapter: chapter,
	}, true
}

func interleaveComicCardGroups(groups [][]model.ComicCard) []model.ComicCard {
	total := 0
	for _, group := range groups {
		total += len(group)
	}
	items := make([]model.ComicCard, 0, total)
	for index := 0; ; index++ {
		added := false
		for _, group := range groups {
			if index < len(group) {
				items = append(items, group[index])
				added = true
			}
		}
		if !added {
			break
		}
	}
	return items
}

func parseMixCatalog(doc *goquery.Document, client *Client) []model.CatalogItem {
	items := make([]model.CatalogItem, 0)
	seen := map[string]bool{}
	doc.Find(".mynimeku-mix-feed__item").Each(func(_ int, card *goquery.Selection) {
		link := card.Find(".mynimeku-mix-feed__series-title[href], .mynimeku-mix-feed__cover[href]").First()
		url := client.absolute(attrAny(link, "href"))
		if !strings.Contains(url, "/komik/") || seen[url] {
			return
		}
		title := cleanText(card.Find(".mynimeku-mix-feed__series-title").First().Text())
		if title == "" {
			title = cleanText(card.Find(".mynimeku-mix-feed__cover").First().AttrOr("aria-label", ""))
		}
		if title == "" {
			return
		}
		seen[url] = true
		genres := make([]string, 0)
		card.Find(".mynimeku-mix-feed__genre").Each(func(_ int, genre *goquery.Selection) {
			value := cleanText(genre.Text())
			if value != "" {
				genres = append(genres, value)
			}
		})
		items = append(items, model.CatalogItem{
			Slug:        slugFromURL(url),
			URL:         url,
			Title:       title,
			Cover:       assetProxyURL(client.absolute(attrAny(card.Find(".mynimeku-mix-feed__cover img").First(), "data-lazy-src", "src"))),
			Type:        cleanText(card.Find(".mynimeku-mix-feed__type").First().Text()),
			Status:      cleanText(card.Find(".mynimeku-mix-feed__status").First().Text()),
			Genres:      genres,
			Description: cleanText(card.Find(".mynimeku-mix-feed__synopsis").First().Text()),
			SourceType:  "comic",
		})
	})
	return items
}

func parseAZCatalog(doc *goquery.Document, client *Client) []model.CatalogItem {
	items := make([]model.CatalogItem, 0)
	seen := map[string]bool{}

	doc.Find(".mynimeku-az-feed__series-title[href]").Each(func(_ int, link *goquery.Selection) {
		rawURL := client.absolute(attrAny(link, "href"))
		sourceType := catalogSourceType(rawURL)
		if sourceType == "" || seen[rawURL] {
			return
		}
		title := cleanText(link.Text())
		if title == "" {
			return
		}
		body := link.ParentsFiltered(".mynimeku-az-feed__body").First()
		card := link.ParentsFiltered(".mynimeku-az-feed__item").First()
		cover := card.ChildrenFiltered(".mynimeku-az-feed__cover").First()
		if cover.Length() == 0 {
			cover = card.Find(".mynimeku-az-feed__cover").First()
		}
		genres := make([]string, 0)
		body.Find(".mynimeku-az-feed__genre").Each(func(_ int, genre *goquery.Selection) {
			value := cleanText(genre.Text())
			if value != "" {
				genres = append(genres, value)
			}
		})

		seen[rawURL] = true
		items = append(items, model.CatalogItem{
			Slug:        slugFromURL(rawURL),
			URL:         rawURL,
			Title:       title,
			Cover:       assetProxyURL(client.absolute(attrAny(cover.Find("img").First(), "data-lazy-src", "data-src", "src"))),
			Type:        firstNonEmpty(cleanText(body.Find(".mynimeku-az-feed__type").First().Text()), "MANGA"),
			Status:      cleanText(body.Find(".mynimeku-az-feed__status").First().Text()),
			Genres:      genres,
			Description: cleanText(body.Find(".mynimeku-az-feed__excerpt, .mynimeku-az-feed__synopsis").First().Text()),
			SourceType:  sourceType,
		})
	})
	return items
}

func catalogSourceType(rawURL string) string {
	switch {
	case strings.Contains(rawURL, "/komik/"):
		return "comic"
	case strings.Contains(rawURL, "/series/"):
		return "series"
	default:
		return ""
	}
}

func extractAZTotalItems(doc *goquery.Document) string {
	value := cleanText(doc.Find(".mynimeku-az-feed__count").First().Text())
	value = strings.TrimSuffix(value, " item")
	value = strings.TrimSpace(value)
	return value
}

func parseGenreList(doc *goquery.Document, client *Client) []model.CatalogItem {
	items := make([]model.CatalogItem, 0)
	doc.Find(".mynimeku-taxonomy-list__item").Each(func(_ int, item *goquery.Selection) {
		url := client.absolute(attrAny(item, "href"))
		name := cleanText(item.Find(".mynimeku-taxonomy-list__name").First().Text())
		if url == "" || name == "" {
			return
		}
		items = append(items, model.CatalogItem{
			Slug:       slugFromURL(url),
			URL:        url,
			Title:      name,
			SourceType: "genre",
			Count:      cleanText(item.Find(".mynimeku-taxonomy-list__item-count").First().Text()),
		})
	})
	return items
}

func parseNavigation(doc *goquery.Document, client *Client) []model.MenuItem {
	var parseList func(*goquery.Selection) []model.MenuItem
	parseList = func(list *goquery.Selection) []model.MenuItem {
		items := make([]model.MenuItem, 0)
		list.ChildrenFiltered("li").Each(func(_ int, li *goquery.Selection) {
			link := li.ChildrenFiltered("a").First()
			label := cleanText(link.Text())
			if label == "" {
				return
			}
			url := client.absolute(attrAny(link, "href"))
			item := model.MenuItem{
				Label: label,
				Slug:  slugFromURL(url),
				Path:  publicMenuPath(url),
				Kind:  menuKind(url),
			}
			if sub := li.ChildrenFiltered("ul").First(); sub.Length() > 0 {
				item.Children = parseList(sub)
			}
			items = append(items, item)
		})
		return items
	}
	return parseList(doc.Find("#menu-menu").First())
}

func parseChapters(doc *goquery.Document, client *Client) []model.Chapter {
	seen := map[string]bool{}
	chapters := make([]model.Chapter, 0)

	doc.Find(".komik-series-chapter-row").Each(func(_ int, row *goquery.Selection) {
		link := row.Find(".komik-series-chapter-item[href], a[href*='/chapter/']").First()
		href := client.absolute(attrAny(link, "href"))
		title := cleanText(link.Find(".komik-series-chapter-item__title").First().Text())
		if title == "" {
			title = cleanText(link.Text())
		}
		if href == "" || title == "" || seen[href] {
			return
		}
		seen[href] = true
		chapters = append(chapters, model.Chapter{
			Slug:   slugFromURL(href),
			Title:  title,
			Number: firstNonEmpty(cleanText(row.AttrOr("data-chapter-number", "")), chapterNumber(title)),
			URL:    href,
			Date:   cleanText(row.Find("time, .komik-series-chapter-item__date, .komik-series-chapter-date").First().Text()),
		})
	})

	if len(chapters) == 0 {
		doc.Find("a[href*='/chapter/']").Each(func(_ int, link *goquery.Selection) {
			href := client.absolute(attrAny(link, "href"))
			title := cleanText(link.Text())
			if href == "" || title == "" || seen[href] {
				return
			}
			seen[href] = true
			chapters = append(chapters, model.Chapter{
				Slug:   slugFromURL(href),
				Title:  title,
				Number: chapterNumber(title),
				URL:    href,
			})
		})
	}

	return chapters
}

func parseSeriesDescription(doc *goquery.Document) string {
	parts := make([]string, 0)
	doc.Find(".komik-series-entry p").Each(func(_ int, p *goquery.Selection) {
		text := cleanText(p.Text())
		if text != "" {
			parts = append(parts, text)
		}
	})
	return strings.Join(parts, "\n\n")
}

func parseSeriesGenres(doc *goquery.Document) []string {
	seen := map[string]bool{}
	genres := make([]string, 0)
	doc.Find(".komik-series-taxonomy a[href*='/genre/']").Each(func(_ int, link *goquery.Selection) {
		genre := cleanText(link.Text())
		if genre != "" && !seen[genre] {
			seen[genre] = true
			genres = append(genres, genre)
		}
	})
	return genres
}

func parseSeriesInfo(doc *goquery.Document) []model.InfoRow {
	rows := make([]model.InfoRow, 0)
	doc.Find(".komik-series-table tr").Each(func(_ int, tr *goquery.Selection) {
		label := cleanText(tr.Find("th").First().Text())
		value := cleanText(tr.Find("td").First().Text())
		if label != "" && value != "" {
			rows = append(rows, model.InfoRow{Label: label, Value: value})
		}
	})
	return rows
}

func parseSeriesEpisodes(doc *goquery.Document, client *Client) []model.SeriesEpisode {
	episodes := make([]model.SeriesEpisode, 0)
	seen := map[string]bool{}
	doc.Find(".komik-series-chapter-item[href*='/episode/']").Each(func(_ int, item *goquery.Selection) {
		href := client.absolute(attrAny(item, "href"))
		if href == "" || seen[href] {
			return
		}
		seen[href] = true
		title := cleanText(item.Find(".komik-series-chapter-item__title").First().Text())
		if title == "" {
			title = cleanText(item.Text())
		}
		episodes = append(episodes, model.SeriesEpisode{
			Slug:   slugFromURL(href),
			Title:  title,
			Number: firstNonEmpty(cleanText(item.Find(".komik-series-chapter-item__num").First().Text()), cleanText(item.AttrOr("data-episode-number", ""))),
			URL:    href,
			Date:   cleanText(item.Find(".komik-series-chapter-item__date").First().Text()),
		})
	})
	return episodes
}

func parseEpisodeSeriesSlug(doc *goquery.Document, client *Client) string {
	slug := ""
	doc.Find(`a[href*="/series/"]`).EachWithBreak(func(_ int, link *goquery.Selection) bool {
		href := client.absolute(attrAny(link, "href"))
		if strings.Contains(href, "/series/") {
			slug = slugFromURL(href)
			return false
		}
		return true
	})
	return slug
}

func parseEpisodeServers(doc *goquery.Document) []model.EpisodeServer {
	servers := make([]model.EpisodeServer, 0)
	seen := map[string]bool{}
	doc.Find(".mynimeku-episode-server-btn[data-player-url]").Each(func(_ int, button *goquery.Selection) {
		url := strings.TrimSpace(attrAny(button, "data-player-url"))
		if url == "" || seen[url] {
			return
		}
		seen[url] = true
		serverType := cleanText(button.AttrOr("data-player-type", ""))
		if serverType == "" {
			serverType = cleanText(button.ParentsFiltered("[data-episode-server-group]").First().AttrOr("data-episode-server-group", "public"))
		}
		servers = append(servers, model.EpisodeServer{
			Type: strings.ToUpper(serverType),
			Host: cleanText(button.AttrOr("data-player-host", "")),
			URL:  url,
		})
	})
	return servers
}

func (s *Service) resolveEpisodeDirectVideo(ctx context.Context, playerURL string) (string, bool) {
	playerURL = html.UnescapeString(strings.TrimSpace(playerURL))
	if playerURL == "" {
		return "", false
	}
	if isDirectVideoURL(playerURL) {
		return playerURL, true
	}
	body, _, err := s.client.getBytes(ctx, playerURL)
	if err != nil {
		return "", false
	}
	source := string(body)
	if direct := firstDirectVideoFromText(source); direct != "" {
		return direct, true
	}
	unpacked := unpackJavaScriptPacker(source)
	if direct := firstDirectVideoFromText(unpacked); direct != "" {
		return direct, true
	}
	return "", false
}

func firstDirectVideoFromText(source string) string {
	patterns := []string{
		`(?i)"file"\s*:\s*"([^"]+)"`,
		`(?i)'file'\s*:\s*'([^']+)'`,
		`(?i)<source[^>]+src=["']([^"']+)["']`,
		`(?i)(https?://[^"'\s<>]+(?:\.m3u8|\.mp4)(?:\?[^"'\s<>]*)?)`,
		`(?i)(https?://[^"'\s<>]+/media/[^"'\s<>]+)`,
	}
	for _, pattern := range patterns {
		match := regexp.MustCompile(pattern).FindStringSubmatch(source)
		if len(match) > 1 {
			value := html.UnescapeString(strings.TrimSpace(match[1]))
			value = strings.ReplaceAll(value, `\/`, `/`)
			if isDirectVideoURL(value) || isLikelyVideoFileURL(value) {
				return value
			}
		}
	}
	return ""
}

func isDirectVideoURL(value string) bool {
	lower := strings.ToLower(value)
	return strings.Contains(lower, ".m3u8") || strings.Contains(lower, ".mp4") || strings.Contains(lower, "/media/")
}

func isLikelyVideoFileURL(value string) bool {
	lower := strings.ToLower(value)
	return strings.HasPrefix(lower, "https://") && !strings.Contains(lower, "mynimeku.com") && !strings.Contains(lower, ".jpg") && !strings.Contains(lower, ".png") && !strings.Contains(lower, ".webp")
}

func isLikelySlowCloudServer(server model.EpisodeServer) bool {
	return strings.Contains(strings.ToLower(server.Host), "cloud")
}

func (s *Service) videoProxyReady(ctx context.Context, rawURL string) bool {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return false
	}
	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Accept", "video/mp4,video/*,*/*;q=0.8")
	req.Header.Set("Accept-Language", "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7")
	req.Header.Set("Referer", "https://players.myplayerku.my.id/")
	req.Header.Set("Origin", "https://players.myplayerku.my.id")
	req.Header.Set("Sec-Fetch-Dest", "video")
	req.Header.Set("Sec-Fetch-Mode", "cors")
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	req.Header.Set("Range", "bytes=0-1023")
	res, err := s.client.httpClient.Do(req)
	if err != nil {
		return false
	}
	defer res.Body.Close()
	return res.StatusCode >= 200 && res.StatusCode <= 299
}

func unpackJavaScriptPacker(source string) string {
	re := regexp.MustCompile(`return p\}\('(.+?)',(\d+),(\d+),'(.*?)'\.split\('\|'\)`)
	match := re.FindStringSubmatch(source)
	if len(match) < 5 {
		return ""
	}
	payload := strings.ReplaceAll(match[1], `\'`, `'`)
	radix, err := strconv.Atoi(match[2])
	if err != nil || radix < 2 {
		return ""
	}
	tokens := strings.Split(match[4], "|")
	wordRe := regexp.MustCompile(`\b[0-9A-Za-z]+\b`)
	return wordRe.ReplaceAllStringFunc(payload, func(word string) string {
		index, ok := decodePackerToken(word, radix)
		if !ok || index < 0 || index >= len(tokens) || tokens[index] == "" {
			return word
		}
		return tokens[index]
	})
}

func decodePackerToken(value string, radix int) (int, bool) {
	total := 0
	for _, char := range value {
		digit := -1
		switch {
		case char >= '0' && char <= '9':
			digit = int(char - '0')
		case char >= 'a' && char <= 'z':
			digit = int(char-'a') + 10
		case char >= 'A' && char <= 'Z':
			digit = int(char-'A') + 36
		}
		if digit < 0 || digit >= radix {
			return 0, false
		}
		total = total*radix + digit
	}
	return total, true
}

func parseEpisodeDownloads(doc *goquery.Document) []model.EpisodeDownload {
	downloads := make([]model.EpisodeDownload, 0)
	doc.Find(".mynimeku-episode-download-card").Each(func(_ int, card *goquery.Selection) {
		resolution := cleanText(card.Find(".mynimeku-episode-download-card__res").First().Text())
		links := make([]model.InfoRow, 0)
		card.Find("a[href]").Each(func(_ int, link *goquery.Selection) {
			label := cleanText(link.Text())
			url := strings.TrimSpace(attrAny(link, "href"))
			if label != "" && url != "" {
				links = append(links, model.InfoRow{Label: label, Value: url})
			}
		})
		if resolution != "" && len(links) > 0 {
			downloads = append(downloads, model.EpisodeDownload{Resolution: resolution, Links: links})
		}
	})
	return downloads
}

func parseReaderImages(doc *goquery.Document, client *Client) []string {
	seen := map[string]bool{}
	images := make([]string, 0)
	selectors := ".chapter-content img, .reader-area img, .entry-content img, article img, .post-body img"
	doc.Find(selectors).Each(func(_ int, img *goquery.Selection) {
		src := client.absolute(attrAny(img, "data-lazy-src", "data-src", "src"))
		if !isReaderImageURL(src) || seen[src] {
			return
		}
		seen[src] = true
		images = append(images, assetProxyURL(src))
	})
	return images
}

func (s *Service) readerImagesFromREST(ctx context.Context, doc *goquery.Document) ([]string, error) {
	chapterID := chapterRESTID(doc)
	if chapterID == "" {
		return nil, nil
	}

	body, _, err := s.client.getBytes(ctx, "/wp-json/wp/v2/chapter/"+chapterID)
	if err != nil {
		return nil, err
	}

	var payload struct {
		Content struct {
			Rendered string `json:"rendered"`
		} `json:"content"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, err
	}
	if strings.TrimSpace(payload.Content.Rendered) == "" {
		return nil, nil
	}

	contentDoc, err := goquery.NewDocumentFromReader(strings.NewReader(payload.Content.Rendered))
	if err != nil {
		return nil, err
	}
	return parseReaderImages(contentDoc, s.client), nil
}

func chapterRESTID(doc *goquery.Document) string {
	var id string
	re := regexp.MustCompile(`/wp-json/wp/v2/chapter/([0-9]+)`)
	doc.Find(`link[rel="alternate"][type="application/json"], link[href*="/wp-json/wp/v2/chapter/"]`).EachWithBreak(func(_ int, sel *goquery.Selection) bool {
		href := attrAny(sel, "href")
		match := re.FindStringSubmatch(href)
		if len(match) > 1 {
			id = match[1]
			return false
		}
		return true
	})
	if id != "" {
		return id
	}
	doc.Find(`a[href*="file.mydriveku.my.id/api/v1/komik/"]`).EachWithBreak(func(_ int, sel *goquery.Selection) bool {
		href := attrAny(sel, "href")
		match := regexp.MustCompile(`/komik/([0-9]+)`).FindStringSubmatch(href)
		if len(match) > 1 {
			id = match[1]
			return false
		}
		return true
	})
	return id
}

func isReaderImageURL(src string) bool {
	if src == "" {
		return false
	}
	blocked := []string{"logo-mynimeku", "icon-mynimeku", "gravatar.com/avatar", "youtube.png"}
	for _, item := range blocked {
		if strings.Contains(src, item) {
			return false
		}
	}
	return strings.Contains(src, "image.mydriveku.my.id/api/view-image/") ||
		strings.Contains(src, "/wp-content/uploads/") ||
		strings.Contains(src, "/api/view-image/")
}

func parseDetailBadges(doc *goquery.Document, detail *model.ComicDetail) {
	doc.Find(".komik-series-badge, .mynimeku-update-feed__badge, a[rel='tag']").Each(func(_ int, sel *goquery.Selection) {
		text := cleanText(sel.Text())
		upper := strings.ToUpper(text)
		switch {
		case detail.Type == "" && (upper == "MANGA" || upper == "MANHWA" || upper == "MANHUA"):
			detail.Type = text
		case detail.Status == "" && (strings.Contains(upper, "GOING") || strings.Contains(upper, "COMPLETED")):
			detail.Status = text
		}
	})
}

func parseGenres(doc *goquery.Document, detail *model.ComicDetail) {
	seen := map[string]bool{}
	doc.Find("a[href*='/genre/']").Each(func(_ int, sel *goquery.Selection) {
		genre := cleanText(sel.Text())
		if genre == "" || seen[genre] {
			return
		}
		seen[genre] = true
		detail.Genres = append(detail.Genres, genre)
	})
}

func extractTotalPages(doc *goquery.Document) int {
	return extractTotalPagesFromSelector(doc, ".mynimeku-update-feed__pagination a, .mynimeku-update-feed__pagination span")
}

func extractTotalPagesFromSelector(doc *goquery.Document, selector string) int {
	maxPage := 1
	doc.Find(selector).Each(func(_ int, sel *goquery.Selection) {
		if value, err := strconv.Atoi(cleanText(sel.Text())); err == nil && value > maxPage {
			maxPage = value
		}
	})
	return maxPage
}

func publicMenuPath(raw string) string {
	switch {
	case strings.Contains(raw, "/latest-komik/"):
		return "/komik"
	case strings.Contains(raw, "/genre-list/"):
		return "/genres"
	case strings.Contains(raw, "/full-list/mix/o:popular/"):
		return "/explore?order=popular"
	case strings.Contains(raw, "s:completed"):
		return "/explore?status=completed"
	case strings.Contains(raw, "s:on-going"):
		return "/explore?status=on-going"
	case strings.Contains(raw, "t:MANGA"):
		return "/explore?type=MANGA"
	case strings.Contains(raw, "t:MANHUA"):
		return "/explore?type=MANHUA"
	case strings.Contains(raw, "t:MANHWA"):
		return "/explore?type=MANHWA"
	case strings.Contains(raw, "t:ONE-SHOT"):
		return "/explore?type=ONE-SHOT"
	case strings.Contains(raw, "/full-list/"):
		return "/komik"
	default:
		return "/"
	}
}

func menuKind(raw string) string {
	switch {
	case strings.Contains(raw, "genre"):
		return "genre"
	case strings.Contains(raw, "popular"):
		return "popular"
	case strings.Contains(raw, "completed") || strings.Contains(raw, "on-going"):
		return "status"
	case strings.Contains(raw, "t:"):
		return "type"
	case strings.Contains(raw, "latest"):
		return "latest"
	default:
		return "menu"
	}
}

func metaContent(doc *goquery.Document, attrName, attrValue string) string {
	var content string
	doc.Find(fmt.Sprintf(`meta[%s="%s"]`, attrName, attrValue)).EachWithBreak(func(_ int, sel *goquery.Selection) bool {
		content = attrAny(sel, "content")
		return content == ""
	})
	return cleanText(content)
}

func chapterNumber(title string) string {
	re := regexp.MustCompile(`(?i)(?:ch\.?|chapter)\s*([0-9]+(?:\.[0-9]+)?)`)
	match := re.FindStringSubmatch(title)
	if len(match) > 1 {
		return match[1]
	}
	return ""
}

type sitemapIndex struct {
	Sitemaps []sitemapLoc `xml:"sitemap"`
}

type urlSet struct {
	URLs []sitemapLoc `xml:"url"`
}

type sitemapLoc struct {
	Loc     string `xml:"loc"`
	LastMod string `xml:"lastmod"`
}

func (s *Service) countSitemapPages(ctx context.Context, prefix string) (int, error) {
	body, _, err := s.client.getBytes(ctx, "/sitemap_index.xml")
	if err != nil {
		return 0, err
	}
	var index sitemapIndex
	if err := xml.Unmarshal(body, &index); err != nil {
		return 0, err
	}
	count := 0
	for _, item := range index.Sitemaps {
		if strings.Contains(item.Loc, "/"+prefix) {
			count++
		}
	}
	if count == 0 {
		count = 1
	}
	return count, nil
}

func (s *Service) parseURLSet(ctx context.Context, path string, sourceType string) ([]model.CatalogItem, error) {
	body, _, err := s.client.getBytes(ctx, path)
	if err != nil {
		return nil, err
	}
	var set urlSet
	if err := xml.Unmarshal(body, &set); err != nil {
		return nil, err
	}
	items := make([]model.CatalogItem, 0, len(set.URLs))
	for _, item := range set.URLs {
		if item.Loc == "" {
			continue
		}
		items = append(items, model.CatalogItem{
			Slug:       slugFromURL(item.Loc),
			URL:        item.Loc,
			LastMod:    item.LastMod,
			SourceType: sourceType,
		})
	}
	return items, nil
}

func isCatalogSitemap(raw string) bool {
	lower := strings.ToLower(raw)
	return strings.Contains(lower, "komik-sitemap") ||
		strings.Contains(lower, "series-sitemap") ||
		strings.Contains(lower, "/komik/") ||
		strings.Contains(lower, "/series/")
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}
