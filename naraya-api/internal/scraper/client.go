package scraper

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"naraya-api/internal/proxytoken"
)

type Client struct {
	baseURL    string
	httpClient *http.Client
}

func assetProxyURL(raw string) string {
	return protectedImageProxyURL(raw)
}

func coverProxyURL(raw string) string {
	if raw == "" {
		return ""
	}
	return "/api/images/" + proxytoken.EncodeWithScope("public-image", raw)
}

func protectedImageProxyURL(raw string) string {
	if raw == "" {
		return ""
	}
	return "/api/images/" + proxytoken.EncodeWithScope("reader-image", raw)
}

func videoProxyURL(raw string) string {
	if raw == "" {
		return ""
	}
	return "/api/videos/" + proxytoken.Encode(raw)
}

func videoSourceURL(raw string) string {
	if raw == "" {
		return ""
	}
	return "/api/video-source/" + proxytoken.Encode(raw)
}

func NewClient(baseURL string, timeout time.Duration) *Client {
	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

func (c *Client) getBytes(ctx context.Context, path string) ([]byte, string, error) {
	target := c.absolute(path)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target, nil)
	if err != nil {
		return nil, "", err
	}
	req.Header.Set("User-Agent", "NarayaBot/1.0 (+development; respectful cache)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml,text/xml")

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode > 299 {
		return nil, "", fmt.Errorf("catalog service returned status %d", res.StatusCode)
	}
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, "", err
	}
	return body, target, nil
}

func (c *Client) getDocument(ctx context.Context, path string) (*goquery.Document, string, error) {
	target := c.absolute(path)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target, nil)
	if err != nil {
		return nil, "", err
	}
	req.Header.Set("User-Agent", "NarayaBot/1.0 (+development; respectful cache)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode > 299 {
		return nil, "", fmt.Errorf("catalog service returned status %d", res.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		return nil, "", err
	}
	return doc, target, nil
}

func (c *Client) absolute(raw string) string {
	if raw == "" {
		return c.baseURL
	}
	if strings.HasPrefix(raw, "//") {
		return "https:" + raw
	}
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}
	base, err := url.Parse(c.baseURL + "/")
	if err != nil {
		return raw
	}
	ref, err := url.Parse(raw)
	if err != nil {
		return raw
	}
	return base.ResolveReference(ref).String()
}

func slugFromURL(raw string) string {
	parsed, err := url.Parse(raw)
	if err != nil {
		return ""
	}
	parts := strings.Split(strings.Trim(parsed.Path, "/"), "/")
	if len(parts) == 0 {
		return ""
	}
	return parts[len(parts)-1]
}

func cleanText(value string) string {
	text := strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
	replacer := strings.NewReplacer(
		"â", "\"",
		"â", "\"",
		"â€œ", "\"",
		"â€", "\"",
		"â", "'",
		"â€™", "'",
		"â", "'",
		"â€˜", "'",
		"â¦", "...",
		"â€¦", "...",
		"â", "-",
		"â€“", "-",
		"â", "-",
		"â€”", "-",
	)
	return replacer.Replace(text)
}

func attrAny(sel *goquery.Selection, names ...string) string {
	for _, name := range names {
		if value, ok := sel.Attr(name); ok && strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}
