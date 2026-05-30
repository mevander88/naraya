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
	max   int
}

const defaultCacheMaxItems = 512

func NewCache[T any](ttl time.Duration) *Cache[T] {
	return &Cache[T]{
		items: make(map[string]cacheItem[T]),
		ttl:   ttl,
		max:   defaultCacheMaxItems,
	}
}

func (c *Cache[T]) Get(key string) (T, bool) {
	c.mu.RLock()
	item, ok := c.items[key]
	c.mu.RUnlock()
	var zero T
	if !ok || time.Now().After(item.expiresAt) {
		if ok {
			c.mu.Lock()
			if current, exists := c.items[key]; exists && time.Now().After(current.expiresAt) {
				delete(c.items, key)
			}
			c.mu.Unlock()
		}
		return zero, false
	}
	return item.value, true
}

func (c *Cache[T]) Set(key string, value T) {
	c.mu.Lock()
	c.deleteExpiredLocked(time.Now())
	if c.max > 0 && len(c.items) >= c.max {
		c.deleteOldestLocked()
	}
	c.items[key] = cacheItem[T]{
		value:     value,
		expiresAt: time.Now().Add(c.ttl),
	}
	c.mu.Unlock()
}

func (c *Cache[T]) deleteExpiredLocked(now time.Time) {
	for key, item := range c.items {
		if now.After(item.expiresAt) {
			delete(c.items, key)
		}
	}
}

func (c *Cache[T]) deleteOldestLocked() {
	oldestKey := ""
	var oldest time.Time
	for key, item := range c.items {
		if oldestKey == "" || item.expiresAt.Before(oldest) {
			oldestKey = key
			oldest = item.expiresAt
		}
	}
	if oldestKey != "" {
		delete(c.items, oldestKey)
	}
}
