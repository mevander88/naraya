package store

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"naraya-api/internal/model"
)

type Store struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Store {
	return &Store{db: db}
}

func (s *Store) CreateUser(ctx context.Context, req model.CreateUserRequest) (model.User, error) {
	row := s.db.QueryRow(ctx, `
		INSERT INTO naraya_users (username, email, display_name, avatar_url, bio, password_hash)
		VALUES ($1, lower($2), $3, $4, $5, crypt($6, gen_salt('bf')))
		RETURNING id::text, username, email, display_name, avatar_url, bio, role, created_at, updated_at
	`, strings.TrimSpace(req.Username), strings.TrimSpace(req.Email), strings.TrimSpace(req.DisplayName), strings.TrimSpace(req.AvatarURL), strings.TrimSpace(req.Bio), req.Password)
	return scanUser(row)
}

func (s *Store) GetUser(ctx context.Context, id string) (model.User, error) {
	row := s.db.QueryRow(ctx, `
		SELECT id::text, username, email, display_name, avatar_url, bio, role, created_at, updated_at
		FROM naraya_users
		WHERE id = $1
	`, id)
	return scanUser(row)
}

func (s *Store) Login(ctx context.Context, req model.LoginRequest, userAgent, ipAddress string) (model.AuthResponse, error) {
	identifier := strings.ToLower(strings.TrimSpace(req.Identifier))
	row := s.db.QueryRow(ctx, `
		SELECT id::text, username, email, display_name, avatar_url, bio, role, created_at, updated_at
		FROM naraya_users
		WHERE (lower(username) = $1 OR lower(email) = $1)
		  AND password_hash = crypt($2, password_hash)
	`, identifier, req.Password)
	user, err := scanUser(row)
	if err != nil {
		return model.AuthResponse{}, err
	}
	return s.CreateSession(ctx, user, userAgent, ipAddress)
}

func (s *Store) CreateSession(ctx context.Context, user model.User, userAgent, ipAddress string) (model.AuthResponse, error) {
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return model.AuthResponse{}, err
	}
	token := base64.RawURLEncoding.EncodeToString(tokenBytes)
	tokenHash := hashToken(token)
	expiresAt := time.Now().UTC().Add(30 * 24 * time.Hour)
	_, err := s.db.Exec(ctx, `
		INSERT INTO naraya_sessions (user_id, token_hash, user_agent, ip_address, expires_at)
		VALUES ($1, $2, $3, $4, $5)
	`, user.ID, tokenHash, strings.TrimSpace(userAgent), strings.TrimSpace(ipAddress), expiresAt)
	if err != nil {
		return model.AuthResponse{}, err
	}
	return model.AuthResponse{Token: token, ExpiresAt: expiresAt, User: user}, nil
}

func (s *Store) UserBySession(ctx context.Context, token string) (model.User, error) {
	row := s.db.QueryRow(ctx, `
		SELECT u.id::text, u.username, u.email, u.display_name, u.avatar_url, u.bio, u.role, u.created_at, u.updated_at
		FROM naraya_sessions s
		JOIN naraya_users u ON u.id = s.user_id
		WHERE s.token_hash = $1
		  AND s.revoked_at IS NULL
		  AND s.expires_at > now()
	`, hashToken(token))
	return scanUser(row)
}

func (s *Store) RevokeSession(ctx context.Context, token string) error {
	_, err := s.db.Exec(ctx, `
		UPDATE naraya_sessions
		SET revoked_at = now()
		WHERE token_hash = $1 AND revoked_at IS NULL
	`, hashToken(token))
	return err
}

func (s *Store) GetSettings(ctx context.Context, userID string) (model.UserSettings, error) {
	row := s.db.QueryRow(ctx, `
		INSERT INTO naraya_user_settings (user_id)
		VALUES ($1)
		ON CONFLICT (user_id) DO NOTHING
		RETURNING user_id::text, immersive_mode, auto_bookmark, mature_filter, high_quality_images, updated_at
	`, userID)
	settings, err := scanSettings(row)
	if err == nil {
		return settings, nil
	}
	row = s.db.QueryRow(ctx, `
		SELECT user_id::text, immersive_mode, auto_bookmark, mature_filter, high_quality_images, updated_at
		FROM naraya_user_settings
		WHERE user_id = $1
	`, userID)
	return scanSettings(row)
}

func (s *Store) UpdateSettings(ctx context.Context, userID string, req model.UpdateSettingsRequest) (model.UserSettings, error) {
	current, err := s.GetSettings(ctx, userID)
	if err != nil {
		return model.UserSettings{}, err
	}
	immersiveMode := current.ImmersiveMode
	autoBookmark := current.AutoBookmark
	matureFilter := current.MatureFilter
	highQualityImages := current.HighQualityImages
	if req.ImmersiveMode != nil {
		immersiveMode = *req.ImmersiveMode
	}
	if req.AutoBookmark != nil {
		autoBookmark = *req.AutoBookmark
	}
	if req.MatureFilter != nil {
		matureFilter = *req.MatureFilter
	}
	if req.HighQualityImages != nil {
		highQualityImages = *req.HighQualityImages
	}
	row := s.db.QueryRow(ctx, `
		INSERT INTO naraya_user_settings (user_id, immersive_mode, auto_bookmark, mature_filter, high_quality_images, updated_at)
		VALUES ($1, $2, $3, $4, $5, now())
		ON CONFLICT (user_id) DO UPDATE SET
			immersive_mode = EXCLUDED.immersive_mode,
			auto_bookmark = EXCLUDED.auto_bookmark,
			mature_filter = EXCLUDED.mature_filter,
			high_quality_images = EXCLUDED.high_quality_images,
			updated_at = now()
		RETURNING user_id::text, immersive_mode, auto_bookmark, mature_filter, high_quality_images, updated_at
	`, userID, immersiveMode, autoBookmark, matureFilter, highQualityImages)
	return scanSettings(row)
}

func (s *Store) ListLibrary(ctx context.Context, userID string) ([]model.LibraryItem, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id::text, user_id::text, comic_slug, comic_title, COALESCE(content_kind, 'comic'), cover_url, source_url, latest_chapter_slug,
		       last_chapter_slug, last_chapter_title, status, progress_percent, is_bookmarked,
		       added_at, updated_at, last_read_at
		FROM naraya_library_items
		WHERE user_id = $1
		ORDER BY updated_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.LibraryItem, 0)
	for rows.Next() {
		item, err := scanLibraryItem(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) UpsertLibrary(ctx context.Context, req model.UpsertLibraryRequest) (model.LibraryItem, error) {
	row := s.db.QueryRow(ctx, `
		INSERT INTO naraya_library_items (
			user_id, comic_slug, comic_title, content_kind, cover_url, source_url, latest_chapter_slug,
			last_chapter_slug, last_chapter_title, status, progress_percent, is_bookmarked, last_read_at
		)
		VALUES ($1, $2, $3, COALESCE(NULLIF($4, ''), 'comic'), $5, $6, $7, $8, $9, COALESCE(NULLIF($10, ''), 'reading'), $11, $12, now())
		ON CONFLICT (user_id, comic_slug) DO UPDATE SET
			comic_title = EXCLUDED.comic_title,
			content_kind = EXCLUDED.content_kind,
			cover_url = EXCLUDED.cover_url,
			source_url = EXCLUDED.source_url,
			latest_chapter_slug = EXCLUDED.latest_chapter_slug,
			last_chapter_slug = EXCLUDED.last_chapter_slug,
			last_chapter_title = EXCLUDED.last_chapter_title,
			status = EXCLUDED.status,
			progress_percent = EXCLUDED.progress_percent,
			is_bookmarked = EXCLUDED.is_bookmarked,
			last_read_at = now(),
			updated_at = now()
		RETURNING id::text, user_id::text, comic_slug, comic_title, COALESCE(content_kind, 'comic'), cover_url, source_url, latest_chapter_slug,
		          last_chapter_slug, last_chapter_title, status, progress_percent, is_bookmarked,
		          added_at, updated_at, last_read_at
	`, req.UserID, req.ComicSlug, req.ComicTitle, req.ContentKind, req.CoverURL, req.SourceURL, req.LatestChapterSlug,
		req.LastChapterSlug, req.LastChapterTitle, req.Status, req.ProgressPercent, req.IsBookmarked)
	return scanLibraryItem(row)
}

func (s *Store) DeleteLibrary(ctx context.Context, userID, comicSlug string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM naraya_library_items WHERE user_id = $1 AND comic_slug = $2`, userID, comicSlug)
	return err
}

func (s *Store) ListComments(ctx context.Context, comicSlug, chapterSlug string) ([]model.Comment, error) {
	rows, err := s.db.Query(ctx, `
		SELECT c.id::text, c.user_id::text, u.username, u.display_name, u.avatar_url, u.role,
		       c.comic_slug, c.chapter_slug, COALESCE(c.parent_id::text, ''), c.body,
		       c.is_edited, c.created_at, c.updated_at
		FROM naraya_comments c
		JOIN naraya_users u ON u.id = c.user_id
		WHERE c.deleted_at IS NULL
		  AND ($1 = '' OR c.comic_slug = $1)
		  AND ($2 = '' OR c.chapter_slug = $2)
		ORDER BY c.created_at DESC
		LIMIT 100
	`, comicSlug, chapterSlug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	comments := make([]model.Comment, 0)
	for rows.Next() {
		comment, err := scanComment(rows)
		if err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}
	return comments, rows.Err()
}

func (s *Store) CreateComment(ctx context.Context, req model.CreateCommentRequest) (model.Comment, error) {
	parentID := strings.TrimSpace(req.ParentID)
	if parentID == "" {
		parentID = "00000000-0000-0000-0000-000000000000"
	}
	row := s.db.QueryRow(ctx, `
		WITH inserted AS (
			INSERT INTO naraya_comments (user_id, comic_slug, chapter_slug, parent_id, body)
			VALUES ($1, $2, $3, NULLIF($4, '00000000-0000-0000-0000-000000000000')::uuid, $5)
			RETURNING *
		)
		SELECT c.id::text, c.user_id::text, u.username, u.display_name, u.avatar_url, u.role,
		       c.comic_slug, c.chapter_slug, COALESCE(c.parent_id::text, ''), c.body,
		       c.is_edited, c.created_at, c.updated_at
		FROM inserted c
		JOIN naraya_users u ON u.id = c.user_id
	`, req.UserID, strings.TrimSpace(req.ComicSlug), strings.TrimSpace(req.ChapterSlug), parentID, strings.TrimSpace(req.Body))
	return scanComment(row)
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanUser(row rowScanner) (model.User, error) {
	var user model.User
	err := row.Scan(&user.ID, &user.Username, &user.Email, &user.DisplayName, &user.AvatarURL, &user.Bio, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	return user, err
}

func scanLibraryItem(row rowScanner) (model.LibraryItem, error) {
	var item model.LibraryItem
	var lastReadAt pgtype.Timestamptz
	err := row.Scan(
		&item.ID, &item.UserID, &item.ComicSlug, &item.ComicTitle, &item.ContentKind, &item.CoverURL, &item.SourceURL,
		&item.LatestChapterSlug, &item.LastChapterSlug, &item.LastChapterTitle, &item.Status,
		&item.ProgressPercent, &item.IsBookmarked, &item.AddedAt, &item.UpdatedAt, &lastReadAt,
	)
	if lastReadAt.Valid {
		value := time.Time(lastReadAt.Time)
		item.LastReadAt = &value
	}
	return item, err
}

func scanComment(row rowScanner) (model.Comment, error) {
	var comment model.Comment
	err := row.Scan(
		&comment.ID, &comment.UserID, &comment.Username, &comment.DisplayName, &comment.AvatarURL, &comment.Role,
		&comment.ComicSlug, &comment.ChapterSlug, &comment.ParentID, &comment.Body,
		&comment.IsEdited, &comment.CreatedAt, &comment.UpdatedAt,
	)
	return comment, err
}

func scanSettings(row rowScanner) (model.UserSettings, error) {
	var settings model.UserSettings
	err := row.Scan(
		&settings.UserID, &settings.ImmersiveMode, &settings.AutoBookmark,
		&settings.MatureFilter, &settings.HighQualityImages, &settings.UpdatedAt,
	)
	return settings, err
}

func IsNotFound(err error) bool {
	return err == pgx.ErrNoRows
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(token)))
	return hex.EncodeToString(sum[:])
}
