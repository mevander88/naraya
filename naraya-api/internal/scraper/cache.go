package scraper

import (
	"sync"
	"time"
)

type cacheItem[T any] struct {
	value     T
	expiresAt time.Time
}

type Cache[T any] struct {
	mu    sync.RWMutex
	items map[string]cacheItem[T]
	ttl   time.Duration
}

func NewCache[T any](ttl time.Duration) *Cache[T] {
	return &Cache[T]{
		items: make(map[string]cacheItem[T]),
		ttl:   ttl,
	}
}

func (c *Cache[T]) Get(key string) (T, bool) {
	c.mu.RLock()
	item, ok := c.items[key]
	c.mu.RUnlock()
	var zero T
	if !ok || time.Now().After(item.expiresAt) {
		return zero, false
	}
	return item.value, true
}

func (c *Cache[T]) Set(key string, value T) {
	c.mu.Lock()
	c.items[key] = cacheItem[T]{
		value:     value,
		expiresAt: time.Now().Add(c.ttl),
	}
	c.mu.Unlock()
}
