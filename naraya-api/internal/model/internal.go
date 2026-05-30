package model

import "time"

type User struct {
	ID          string    `json:"id"`
	Username    string    `json:"username"`
	Email       string    `json:"email"`
	DisplayName string    `json:"displayName"`
	AvatarURL   string    `json:"avatarUrl"`
	Bio         string    `json:"bio"`
	Role        string    `json:"role"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type CreateUserRequest struct {
	Username    string `json:"username"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
	AvatarURL   string `json:"avatarUrl"`
	Bio         string `json:"bio"`
	Password    string `json:"password"`
}

type LoginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

type AuthResponse struct {
	Token     string    `json:"-"`
	ExpiresAt time.Time `json:"expiresAt"`
	User      User      `json:"user"`
}

type UserSettings struct {
	UserID            string    `json:"userId"`
	AutoBookmark      bool      `json:"autoBookmark"`
	MatureFilter      bool      `json:"matureFilter"`
	HighQualityImages bool      `json:"highQualityImages"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

type UserStats struct {
	LibraryTotal int `json:"libraryTotal"`
	Completed    int `json:"completed"`
	CommentTotal int `json:"commentTotal"`
	LoveTotal    int `json:"loveTotal"`
}

type UpdateSettingsRequest struct {
	AutoBookmark      *bool `json:"autoBookmark"`
	MatureFilter      *bool `json:"matureFilter"`
	HighQualityImages *bool `json:"highQualityImages"`
}

type LibraryItem struct {
	ID                string     `json:"id"`
	UserID            string     `json:"userId"`
	ComicSlug         string     `json:"comicSlug"`
	ComicTitle        string     `json:"comicTitle"`
	ContentKind       string     `json:"contentKind"`
	CoverURL          string     `json:"coverUrl"`
	SourceURL         string     `json:"-"`
	LatestChapterSlug string     `json:"latestChapterSlug"`
	LastChapterSlug   string     `json:"lastChapterSlug"`
	LastChapterTitle  string     `json:"lastChapterTitle"`
	Status            string     `json:"status"`
	ProgressPercent   int        `json:"progressPercent"`
	IsBookmarked      bool       `json:"isBookmarked"`
	AddedAt           time.Time  `json:"addedAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
	LastReadAt        *time.Time `json:"lastReadAt,omitempty"`
}

type LibraryCounts struct {
	Favorites int `json:"favorites"`
	History   int `json:"history"`
}

type LibraryPage struct {
	Items      []LibraryItem `json:"items"`
	Counts     LibraryCounts `json:"counts"`
	NextCursor string        `json:"nextCursor,omitempty"`
	HasMore    bool          `json:"hasMore"`
}

type LoveItem struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	TargetSlug  string    `json:"targetSlug"`
	TargetTitle string    `json:"targetTitle"`
	ContentKind string    `json:"contentKind"`
	CoverURL    string    `json:"coverUrl"`
	TargetURL   string    `json:"targetUrl"`
	CreatedAt   time.Time `json:"createdAt"`
}

type LoveStatus struct {
	TargetSlug string `json:"targetSlug"`
	Count      int    `json:"count"`
	Loved      bool   `json:"loved"`
}

type FavoriteStatus struct {
	TargetSlug string `json:"targetSlug"`
	Count      int    `json:"count"`
	Favorited  bool   `json:"favorited"`
}

type CreateLoveRequest struct {
	UserID      string `json:"userId"`
	TargetSlug  string `json:"targetSlug"`
	TargetTitle string `json:"targetTitle"`
	ContentKind string `json:"contentKind"`
	CoverURL    string `json:"coverUrl"`
	TargetURL   string `json:"targetUrl"`
}

type UpsertLibraryRequest struct {
	UserID            string `json:"userId"`
	ComicSlug         string `json:"comicSlug"`
	ComicTitle        string `json:"comicTitle"`
	ContentKind       string `json:"contentKind"`
	CoverURL          string `json:"coverUrl"`
	SourceURL         string `json:"-"`
	LatestChapterSlug string `json:"latestChapterSlug"`
	LastChapterSlug   string `json:"lastChapterSlug"`
	LastChapterTitle  string `json:"lastChapterTitle"`
	Status            string `json:"status"`
	ProgressPercent   int    `json:"progressPercent"`
	IsBookmarked      bool   `json:"isBookmarked"`
}

type Comment struct {
	ID                string    `json:"id"`
	UserID            string    `json:"userId"`
	Username          string    `json:"username"`
	DisplayName       string    `json:"displayName"`
	AvatarURL         string    `json:"avatarUrl"`
	Role              string    `json:"role"`
	ComicSlug         string    `json:"comicSlug"`
	ChapterSlug       string    `json:"chapterSlug"`
	ParentID          string    `json:"parentId,omitempty"`
	ParentUsername    string    `json:"parentUsername,omitempty"`
	ParentDisplayName string    `json:"parentDisplayName,omitempty"`
	ParentBody        string    `json:"parentBody,omitempty"`
	Body              string    `json:"body"`
	IsEdited          bool      `json:"isEdited"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

type CommentPage struct {
	Items      []Comment `json:"items"`
	NextCursor string    `json:"nextCursor,omitempty"`
	HasMore    bool      `json:"hasMore"`
	Total      int       `json:"total"`
}

type CreateCommentRequest struct {
	UserID      string `json:"userId"`
	ComicSlug   string `json:"comicSlug"`
	ChapterSlug string `json:"chapterSlug"`
	ParentID    string `json:"parentId"`
	Body        string `json:"body"`
}
