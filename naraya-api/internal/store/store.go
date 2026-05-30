package store

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
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
	user, err := s.loginByUsername(ctx, identifier, req.Password)
	if err != nil {
		if err != pgx.ErrNoRows {
			return model.AuthResponse{}, err
		}
		user, err = s.loginByEmail(ctx, identifier, req.Password)
		if err != nil {
			return model.AuthResponse{}, err
		}
	}
	return s.CreateSession(ctx, user, userAgent, ipAddress)
}

func (s *Store) loginByUsername(ctx context.Context, username, password string) (model.User, error) {
	row := s.db.QueryRow(ctx, `
		SELECT id::text, username, email, display_name, avatar_url, bio, role, created_at, updated_at
		FROM naraya_users
		WHERE lower(username) = $1
		  AND password_hash = crypt($2, password_hash)
	`, username, password)
	return scanUser(row)
}

func (s *Store) loginByEmail(ctx context.Context, email, password string) (model.User, error) {
	row := s.db.QueryRow(ctx, `
		SELECT id::text, username, email, display_name, avatar_url, bio, role, created_at, updated_at
		FROM naraya_users
		WHERE lower(email) = $1
		  AND password_hash = crypt($2, password_hash)
	`, email, password)
	return scanUser(row)
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
		WITH inserted AS (
			INSERT INTO naraya_user_settings (user_id)
			VALUES ($1)
			ON CONFLICT (user_id) DO NOTHING
			RETURNING user_id::text, auto_bookmark, mature_filter, high_quality_images, updated_at
		)
		SELECT user_id::text, auto_bookmark, mature_filter, high_quality_images, updated_at
		FROM inserted
		UNION ALL
		SELECT user_id::text, auto_bookmark, mature_filter, high_quality_images, updated_at
		FROM naraya_user_settings
		WHERE user_id = $1
		  AND NOT EXISTS (SELECT 1 FROM inserted)
	`, userID)
	return scanSettings(row)
}

func (s *Store) UserStats(ctx context.Context, userID string) (model.UserStats, error) {
	var stats model.UserStats
	err := s.db.QueryRow(ctx, `
		SELECT
			(SELECT count(*)::int FROM naraya_library_items WHERE user_id = $1),
			(SELECT count(*)::int FROM naraya_library_items WHERE user_id = $1 AND status = 'completed'),
			(SELECT count(*)::int FROM naraya_comments WHERE user_id = $1 AND deleted_at IS NULL),
			(SELECT count(*)::int FROM naraya_love_items WHERE user_id = $1)
	`, userID).Scan(&stats.LibraryTotal, &stats.Completed, &stats.CommentTotal, &stats.LoveTotal)
	return stats, err
}

func (s *Store) UpdateSettings(ctx context.Context, userID string, req model.UpdateSettingsRequest) (model.UserSettings, error) {
	row := s.db.QueryRow(ctx, `
		INSERT INTO naraya_user_settings (user_id, auto_bookmark, mature_filter, high_quality_images, updated_at)
		VALUES ($1, COALESCE($2::boolean, true), COALESCE($3::boolean, false), COALESCE($4::boolean, true), now())
		ON CONFLICT (user_id) DO UPDATE SET
			auto_bookmark = COALESCE($2::boolean, naraya_user_settings.auto_bookmark),
			mature_filter = COALESCE($3::boolean, naraya_user_settings.mature_filter),
			high_quality_images = COALESCE($4::boolean, naraya_user_settings.high_quality_images),
			updated_at = now()
		RETURNING user_id::text, auto_bookmark, mature_filter, high_quality_images, updated_at
	`, userID, nullableBool(req.AutoBookmark), nullableBool(req.MatureFilter), nullableBool(req.HighQualityImages))
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
			is_bookmarked = naraya_library_items.is_bookmarked OR EXCLUDED.is_bookmarked,
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

func (s *Store) FavoriteStatus(ctx context.Context, userID, targetSlug string) (model.FavoriteStatus, error) {
	targetSlug = strings.TrimSpace(targetSlug)
	if targetSlug == "" {
		return model.FavoriteStatus{}, fmt.Errorf("targetSlug is required")
	}
	var count int64
	var favorited bool
	err := s.db.QueryRow(ctx, `
		SELECT COALESCE(fc.favorite_count, 0)::bigint,
		       CASE WHEN $2 = '' THEN false ELSE EXISTS (
		           SELECT 1 FROM naraya_library_items mine
		           WHERE mine.comic_slug = $1
		             AND mine.user_id = NULLIF($2, '')::uuid
		             AND mine.is_bookmarked = true
		       ) END
		FROM (VALUES ($1::text)) target(target_slug)
		LEFT JOIN naraya_favorite_counts fc ON fc.target_slug = target.target_slug
	`, targetSlug, strings.TrimSpace(userID)).Scan(&count, &favorited)
	if err != nil {
		return model.FavoriteStatus{}, err
	}
	return model.FavoriteStatus{TargetSlug: targetSlug, Count: int(count), Favorited: favorited}, nil
}

func (s *Store) LoveStatus(ctx context.Context, userID, targetSlug string) (model.LoveStatus, error) {
	targetSlug = strings.TrimSpace(targetSlug)
	if targetSlug == "" {
		return model.LoveStatus{}, fmt.Errorf("targetSlug is required")
	}
	var count int64
	var loved bool
	err := s.db.QueryRow(ctx, `
		SELECT COALESCE(lc.love_count, 0)::bigint,
		       CASE WHEN $2 = '' THEN false ELSE EXISTS (
		           SELECT 1 FROM naraya_love_items mine
		           WHERE mine.target_slug = $1 AND mine.user_id = NULLIF($2, '')::uuid
		       ) END
		FROM (VALUES ($1::text)) target(target_slug)
		LEFT JOIN naraya_love_counts lc ON lc.target_slug = target.target_slug
	`, targetSlug, strings.TrimSpace(userID)).Scan(&count, &loved)
	if err != nil {
		return model.LoveStatus{}, err
	}
	return model.LoveStatus{TargetSlug: targetSlug, Count: int(count), Loved: loved}, nil
}

func (s *Store) ListUserLoves(ctx context.Context, userID string) ([]model.LoveItem, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id::text, user_id::text, target_slug, target_title, content_kind, cover_url, target_url, created_at
		FROM naraya_love_items
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 100
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.LoveItem, 0)
	for rows.Next() {
		item, err := scanLoveItem(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) CreateLove(ctx context.Context, req model.CreateLoveRequest) (model.LoveStatus, error) {
	userID := strings.TrimSpace(req.UserID)
	targetSlug := strings.TrimSpace(req.TargetSlug)
	targetTitle := strings.TrimSpace(req.TargetTitle)
	contentKind := strings.TrimSpace(req.ContentKind)
	if contentKind == "" {
		contentKind = "comic"
	}
	if userID == "" {
		return model.LoveStatus{}, fmt.Errorf("userId is required")
	}
	if targetSlug == "" || targetTitle == "" {
		return model.LoveStatus{}, fmt.Errorf("targetSlug and targetTitle are required")
	}
	_, err := s.db.Exec(ctx, `
		INSERT INTO naraya_love_items (user_id, target_slug, target_title, content_kind, cover_url, target_url)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id, target_slug) DO NOTHING
	`, userID, targetSlug, targetTitle, contentKind, strings.TrimSpace(req.CoverURL), strings.TrimSpace(req.TargetURL))
	if err != nil {
		return model.LoveStatus{}, err
	}
	return s.LoveStatus(ctx, userID, targetSlug)
}

func (s *Store) ListComments(ctx context.Context, comicSlug, chapterSlug string, limit int, cursor string) (model.CommentPage, error) {
	comicSlug = strings.TrimSpace(comicSlug)
	chapterSlug = strings.TrimSpace(chapterSlug)
	limit = normalizeCommentLimit(limit)

	filter, args := commentTargetFilter(comicSlug, chapterSlug)
	if createdAt, id, ok := decodeCommentCursor(cursor); ok {
		filter += fmt.Sprintf(" AND (c.created_at, c.id) < ($%d::timestamptz, $%d::uuid)", len(args)+1, len(args)+2)
		args = append(args, createdAt, id)
	}
	args = append(args, limit+1)
	rows, err := s.db.Query(ctx, `
		SELECT c.id::text, c.user_id::text, u.username, u.display_name, u.avatar_url, u.role,
		       c.comic_slug, c.chapter_slug, COALESCE(c.parent_id::text, ''),
		       '', '', '',
		       c.body,
		       c.is_edited, c.created_at, c.updated_at
		FROM naraya_comments c
		JOIN naraya_users u ON u.id = c.user_id
		WHERE c.deleted_at IS NULL
		  AND c.parent_id IS NULL
		  AND `+filter+`
		ORDER BY c.created_at DESC, c.id DESC
		LIMIT $`+fmt.Sprint(len(args))+`
	`, args...)
	if err != nil {
		return model.CommentPage{}, err
	}
	defer rows.Close()

	roots := make([]model.Comment, 0, limit+1)
	for rows.Next() {
		comment, err := scanComment(rows)
		if err != nil {
			return model.CommentPage{}, err
		}
		roots = append(roots, comment)
	}
	if err := rows.Err(); err != nil {
		return model.CommentPage{}, err
	}

	hasMore := len(roots) > limit
	if hasMore {
		roots = roots[:limit]
	}
	nextCursor := ""
	if hasMore && len(roots) > 0 {
		last := roots[len(roots)-1]
		nextCursor = encodeCommentCursor(last.CreatedAt, last.ID)
	}
	replies, err := s.listLatestReplies(ctx, roots, 3)
	if err != nil {
		return model.CommentPage{}, err
	}
	items := make([]model.Comment, 0, len(roots)+len(replies))
	items = append(items, roots...)
	items = append(items, replies...)
	return model.CommentPage{Items: items, NextCursor: nextCursor, HasMore: hasMore}, nil
}

func (s *Store) ListUserComments(ctx context.Context, userID string, limit int, cursor string) (model.CommentPage, error) {
	limit = normalizeCommentLimit(limit)
	args := []any{userID}
	cursor = strings.TrimSpace(cursor)
	cursorEmpty := cursor == ""
	cursorFilter := ""
	if createdAt, id, ok := decodeCommentCursor(cursor); ok {
		cursorFilter = fmt.Sprintf("AND (c.created_at, c.id) < ($%d::timestamptz, $%d::uuid)", len(args)+1, len(args)+2)
		args = append(args, createdAt, id)
	}
	args = append(args, limit+1)
	rows, err := s.db.Query(ctx, `
		SELECT c.id::text, c.user_id::text, u.username, u.display_name, u.avatar_url, u.role,
		       c.comic_slug, c.chapter_slug, COALESCE(c.parent_id::text, ''),
		       COALESCE(pu.username, ''), COALESCE(pu.display_name, ''), COALESCE(parent.body, ''),
		       c.body,
		       c.is_edited, c.created_at, c.updated_at
		FROM naraya_comments c
		JOIN naraya_users u ON u.id = c.user_id
		LEFT JOIN naraya_comments parent ON parent.id = c.parent_id AND parent.deleted_at IS NULL
		LEFT JOIN naraya_users pu ON pu.id = parent.user_id
		WHERE c.deleted_at IS NULL
		  AND c.user_id = $1
		  `+cursorFilter+`
		ORDER BY c.created_at DESC, c.id DESC
		LIMIT $`+fmt.Sprint(len(args))+`
	`, args...)
	if err != nil {
		return model.CommentPage{}, err
	}
	defer rows.Close()

	comments := make([]model.Comment, 0, limit+1)
	for rows.Next() {
		comment, err := scanComment(rows)
		if err != nil {
			return model.CommentPage{}, err
		}
		comments = append(comments, comment)
	}
	if err := rows.Err(); err != nil {
		return model.CommentPage{}, err
	}

	hasMore := len(comments) > limit
	if hasMore {
		comments = comments[:limit]
	}
	nextCursor := ""
	if hasMore && len(comments) > 0 {
		last := comments[len(comments)-1]
		nextCursor = encodeCommentCursor(last.CreatedAt, last.ID)
	}
	total := 0
	if cursorEmpty {
		if err := s.db.QueryRow(ctx, `
			SELECT count(*)::int
			FROM naraya_comments
			WHERE deleted_at IS NULL
			  AND user_id = $1
		`, userID).Scan(&total); err != nil {
			return model.CommentPage{}, err
		}
	}
	return model.CommentPage{Items: comments, NextCursor: nextCursor, HasMore: hasMore, Total: total}, nil
}

func (s *Store) listLatestReplies(ctx context.Context, roots []model.Comment, perParent int) ([]model.Comment, error) {
	if len(roots) == 0 || perParent <= 0 {
		return nil, nil
	}
	args := make([]any, 0, len(roots)+1)
	placeholders := make([]string, 0, len(roots))
	for index, root := range roots {
		args = append(args, root.ID)
		placeholders = append(placeholders, fmt.Sprintf("$%d::uuid", index+1))
	}
	args = append(args, perParent)
	rows, err := s.db.Query(ctx, `
		SELECT id, user_id, username, display_name, avatar_url, role,
		       comic_slug, chapter_slug, parent_id,
		       parent_username, parent_display_name, parent_body,
		       body, is_edited, created_at, updated_at
		FROM (
			SELECT c.id::text AS id, c.user_id::text AS user_id, u.username, u.display_name, u.avatar_url, u.role,
			       c.comic_slug, c.chapter_slug, COALESCE(c.parent_id::text, '') AS parent_id,
			       COALESCE(pu.username, '') AS parent_username,
			       COALESCE(pu.display_name, '') AS parent_display_name,
			       COALESCE(parent.body, '') AS parent_body,
			       c.body, c.is_edited, c.created_at, c.updated_at,
			       row_number() OVER (PARTITION BY c.parent_id ORDER BY c.created_at DESC, c.id DESC) AS reply_rank
			FROM naraya_comments c
			JOIN naraya_users u ON u.id = c.user_id
			JOIN naraya_comments parent ON parent.id = c.parent_id AND parent.deleted_at IS NULL
			LEFT JOIN naraya_users pu ON pu.id = parent.user_id
			WHERE c.deleted_at IS NULL
			  AND c.parent_id IN (`+strings.Join(placeholders, ",")+`)
		) ranked
		WHERE reply_rank <= $`+fmt.Sprint(len(args))+`
		ORDER BY created_at DESC, id DESC
	`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	replies := make([]model.Comment, 0)
	for rows.Next() {
		comment, err := scanComment(rows)
		if err != nil {
			return nil, err
		}
		replies = append(replies, comment)
	}
	return replies, rows.Err()
}

func normalizeCommentLimit(limit int) int {
	if limit < 1 {
		return 10
	}
	if limit > 50 {
		return 50
	}
	return limit
}

func commentTargetFilter(comicSlug, chapterSlug string) (string, []any) {
	if comicSlug == "" {
		return "c.chapter_slug = $1", []any{chapterSlug}
	}
	if chapterSlug != "" {
		return "c.comic_slug = $1 AND c.chapter_slug = $2", []any{comicSlug, chapterSlug}
	}
	return "c.comic_slug = $1", []any{comicSlug}
}

func encodeCommentCursor(createdAt time.Time, id string) string {
	payload := createdAt.UTC().Format(time.RFC3339Nano) + "|" + strings.TrimSpace(id)
	return base64.RawURLEncoding.EncodeToString([]byte(payload))
}

func decodeCommentCursor(cursor string) (time.Time, string, bool) {
	decoded, err := base64.RawURLEncoding.DecodeString(strings.TrimSpace(cursor))
	if err != nil {
		return time.Time{}, "", false
	}
	createdAtRaw, id, ok := strings.Cut(string(decoded), "|")
	if !ok || strings.TrimSpace(id) == "" {
		return time.Time{}, "", false
	}
	createdAt, err := time.Parse(time.RFC3339Nano, createdAtRaw)
	if err != nil {
		return time.Time{}, "", false
	}
	return createdAt, strings.TrimSpace(id), true
}

func (s *Store) CreateComment(ctx context.Context, req model.CreateCommentRequest) (model.Comment, error) {
	parentID := strings.TrimSpace(req.ParentID)
	comicSlug := strings.TrimSpace(req.ComicSlug)
	chapterSlug := strings.TrimSpace(req.ChapterSlug)

	if parentID != "" {
		var parentComicSlug string
		var parentChapterSlug string
		err := s.db.QueryRow(ctx, `
			SELECT comic_slug, chapter_slug
			FROM naraya_comments
			WHERE id = $1
			  AND deleted_at IS NULL
		`, parentID).Scan(&parentComicSlug, &parentChapterSlug)
		if err != nil {
			if err == pgx.ErrNoRows {
				return model.Comment{}, fmt.Errorf("parent comment not found")
			}
			return model.Comment{}, err
		}
		if comicSlug == "" {
			comicSlug = parentComicSlug
		}
		if chapterSlug == "" {
			chapterSlug = parentChapterSlug
		}
		if parentComicSlug != "" && comicSlug != "" && parentComicSlug != comicSlug {
			return model.Comment{}, fmt.Errorf("parent comment target mismatch")
		}
		if parentChapterSlug != "" && chapterSlug != "" && parentChapterSlug != chapterSlug {
			return model.Comment{}, fmt.Errorf("parent comment target mismatch")
		}
	}

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
		       c.comic_slug, c.chapter_slug, COALESCE(c.parent_id::text, ''),
		       COALESCE(pu.username, ''), COALESCE(pu.display_name, ''), COALESCE(parent.body, ''),
		       c.body,
		       c.is_edited, c.created_at, c.updated_at
		FROM inserted c
		JOIN naraya_users u ON u.id = c.user_id
		LEFT JOIN naraya_comments parent ON parent.id = c.parent_id AND parent.deleted_at IS NULL
		LEFT JOIN naraya_users pu ON pu.id = parent.user_id
	`, req.UserID, comicSlug, chapterSlug, parentID, strings.TrimSpace(req.Body))
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

func scanLoveItem(row rowScanner) (model.LoveItem, error) {
	var item model.LoveItem
	err := row.Scan(
		&item.ID, &item.UserID, &item.TargetSlug, &item.TargetTitle,
		&item.ContentKind, &item.CoverURL, &item.TargetURL, &item.CreatedAt,
	)
	return item, err
}

func scanComment(row rowScanner) (model.Comment, error) {
	var comment model.Comment
	err := row.Scan(
		&comment.ID, &comment.UserID, &comment.Username, &comment.DisplayName, &comment.AvatarURL, &comment.Role,
		&comment.ComicSlug, &comment.ChapterSlug, &comment.ParentID,
		&comment.ParentUsername, &comment.ParentDisplayName, &comment.ParentBody,
		&comment.Body,
		&comment.IsEdited, &comment.CreatedAt, &comment.UpdatedAt,
	)
	return comment, err
}

func scanSettings(row rowScanner) (model.UserSettings, error) {
	var settings model.UserSettings
	err := row.Scan(
		&settings.UserID, &settings.AutoBookmark,
		&settings.MatureFilter, &settings.HighQualityImages, &settings.UpdatedAt,
	)
	return settings, err
}

func nullableBool(value *bool) any {
	if value == nil {
		return nil
	}
	return *value
}

func IsNotFound(err error) bool {
	return err == pgx.ErrNoRows
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(token)))
	return hex.EncodeToString(sum[:])
}
