--
-- PostgreSQL database dump
--

\restrict qtobQfrpylfpVTkV94zFzkNcCJmAuJMd3oI3sGkDrUK0YJNqpGbHJcdttYZAZqv

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg12+2)
-- Dumped by pg_dump version 18.1 (Debian 18.1-1.pgdg12+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: naraya_favorite_counts_decrement(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.naraya_favorite_counts_decrement() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.is_bookmarked = true THEN
        UPDATE naraya_favorite_counts
        SET favorite_count = GREATEST(favorite_count - 1, 0),
            updated_at = now()
        WHERE target_slug = OLD.comic_slug;

        DELETE FROM naraya_favorite_counts
        WHERE target_slug = OLD.comic_slug
          AND favorite_count = 0;
    END IF;
    RETURN OLD;
END;
$$;


--
-- Name: naraya_favorite_counts_increment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.naraya_favorite_counts_increment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.is_bookmarked = true THEN
        INSERT INTO naraya_favorite_counts (target_slug, favorite_count, updated_at)
        VALUES (NEW.comic_slug, 1, now())
        ON CONFLICT (target_slug) DO UPDATE SET
            favorite_count = naraya_favorite_counts.favorite_count + 1,
            updated_at = now();
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: naraya_favorite_counts_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.naraya_favorite_counts_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.is_bookmarked IS DISTINCT FROM NEW.is_bookmarked THEN
        IF NEW.is_bookmarked = true THEN
            INSERT INTO naraya_favorite_counts (target_slug, favorite_count, updated_at)
            VALUES (NEW.comic_slug, 1, now())
            ON CONFLICT (target_slug) DO UPDATE SET
                favorite_count = naraya_favorite_counts.favorite_count + 1,
                updated_at = now();
        ELSIF OLD.is_bookmarked = true THEN
            UPDATE naraya_favorite_counts
            SET favorite_count = GREATEST(favorite_count - 1, 0),
                updated_at = now()
            WHERE target_slug = OLD.comic_slug;

            DELETE FROM naraya_favorite_counts
            WHERE target_slug = OLD.comic_slug
              AND favorite_count = 0;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: naraya_love_counts_decrement(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.naraya_love_counts_decrement() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE naraya_love_counts
    SET love_count = GREATEST(love_count - 1, 0),
        updated_at = now()
    WHERE target_slug = OLD.target_slug;

    DELETE FROM naraya_love_counts
    WHERE target_slug = OLD.target_slug
      AND love_count = 0;

    RETURN OLD;
END;
$$;


--
-- Name: naraya_love_counts_increment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.naraya_love_counts_increment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO naraya_love_counts (target_slug, love_count, updated_at)
    VALUES (NEW.target_slug, 1, now())
    ON CONFLICT (target_slug) DO UPDATE SET
        love_count = naraya_love_counts.love_count + 1,
        updated_at = now();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: naraya_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.naraya_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    comic_slug text DEFAULT ''::text NOT NULL,
    chapter_slug text DEFAULT ''::text NOT NULL,
    parent_id uuid,
    body text NOT NULL,
    is_edited boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT naraya_comments_body_len CHECK (((char_length(body) >= 1) AND (char_length(body) <= 2000))),
    CONSTRAINT naraya_comments_target_required CHECK (((comic_slug <> ''::text) OR (chapter_slug <> ''::text)))
)
WITH (autovacuum_vacuum_scale_factor='0.05', autovacuum_analyze_scale_factor='0.02');


--
-- Name: naraya_favorite_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.naraya_favorite_counts (
    target_slug text NOT NULL,
    favorite_count bigint DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT naraya_favorite_counts_non_negative CHECK ((favorite_count >= 0))
);


--
-- Name: naraya_library_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.naraya_library_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    comic_slug text NOT NULL,
    comic_title text NOT NULL,
    cover_url text DEFAULT ''::text NOT NULL,
    source_url text DEFAULT ''::text NOT NULL,
    latest_chapter_slug text DEFAULT ''::text NOT NULL,
    last_chapter_slug text DEFAULT ''::text NOT NULL,
    last_chapter_title text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'reading'::text NOT NULL,
    progress_percent integer DEFAULT 0 NOT NULL,
    is_bookmarked boolean DEFAULT false NOT NULL,
    added_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    content_kind text DEFAULT 'comic'::text NOT NULL,
    CONSTRAINT naraya_library_content_kind_allowed CHECK ((content_kind = ANY (ARRAY['comic'::text, 'series'::text]))),
    CONSTRAINT naraya_library_progress_range CHECK (((progress_percent >= 0) AND (progress_percent <= 100))),
    CONSTRAINT naraya_library_status_allowed CHECK ((status = ANY (ARRAY['reading'::text, 'planned'::text, 'completed'::text, 'paused'::text, 'dropped'::text])))
)
WITH (autovacuum_vacuum_scale_factor='0.05', autovacuum_analyze_scale_factor='0.02');


--
-- Name: naraya_love_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.naraya_love_counts (
    target_slug text NOT NULL,
    love_count bigint DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT naraya_love_counts_non_negative CHECK ((love_count >= 0))
);


--
-- Name: naraya_love_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.naraya_love_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    target_slug text NOT NULL,
    target_title text NOT NULL,
    content_kind text DEFAULT 'comic'::text NOT NULL,
    cover_url text DEFAULT ''::text NOT NULL,
    target_url text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT naraya_love_content_kind_allowed CHECK ((content_kind = ANY (ARRAY['comic'::text, 'series'::text]))),
    CONSTRAINT naraya_love_target_required CHECK ((target_slug <> ''::text))
)
WITH (autovacuum_vacuum_scale_factor='0.05', autovacuum_analyze_scale_factor='0.02');


--
-- Name: naraya_schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.naraya_schema_migrations (
    filename text NOT NULL,
    checksum text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: naraya_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.naraya_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    user_agent text DEFAULT ''::text NOT NULL,
    ip_address text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone
)
WITH (autovacuum_vacuum_scale_factor='0.02', autovacuum_analyze_scale_factor='0.01');


--
-- Name: naraya_user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.naraya_user_settings (
    user_id uuid NOT NULL,
    auto_bookmark boolean DEFAULT true NOT NULL,
    mature_filter boolean DEFAULT false NOT NULL,
    high_quality_images boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)
WITH (autovacuum_vacuum_scale_factor='0.05', autovacuum_analyze_scale_factor='0.02');


--
-- Name: naraya_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.naraya_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    display_name text NOT NULL,
    avatar_url text DEFAULT ''::text NOT NULL,
    bio text DEFAULT ''::text NOT NULL,
    role text DEFAULT 'reader'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    password_hash text DEFAULT public.crypt('naraya-demo'::text, public.gen_salt('bf'::text)) NOT NULL,
    CONSTRAINT naraya_users_display_name_len CHECK (((char_length(display_name) >= 1) AND (char_length(display_name) <= 80))),
    CONSTRAINT naraya_users_email_format CHECK (((email = ''::text) OR (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'::text))),
    CONSTRAINT naraya_users_username_len CHECK (((char_length(username) >= 3) AND (char_length(username) <= 40)))
);


--
-- Name: naraya_comments naraya_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_comments
    ADD CONSTRAINT naraya_comments_pkey PRIMARY KEY (id);


--
-- Name: naraya_favorite_counts naraya_favorite_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_favorite_counts
    ADD CONSTRAINT naraya_favorite_counts_pkey PRIMARY KEY (target_slug);


--
-- Name: naraya_library_items naraya_library_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_library_items
    ADD CONSTRAINT naraya_library_items_pkey PRIMARY KEY (id);


--
-- Name: naraya_library_items naraya_library_unique_user_comic; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_library_items
    ADD CONSTRAINT naraya_library_unique_user_comic UNIQUE (user_id, comic_slug);


--
-- Name: naraya_love_counts naraya_love_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_love_counts
    ADD CONSTRAINT naraya_love_counts_pkey PRIMARY KEY (target_slug);


--
-- Name: naraya_love_items naraya_love_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_love_items
    ADD CONSTRAINT naraya_love_items_pkey PRIMARY KEY (id);


--
-- Name: naraya_love_items naraya_love_unique_user_target; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_love_items
    ADD CONSTRAINT naraya_love_unique_user_target UNIQUE (user_id, target_slug);


--
-- Name: naraya_schema_migrations naraya_schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_schema_migrations
    ADD CONSTRAINT naraya_schema_migrations_pkey PRIMARY KEY (filename);


--
-- Name: naraya_sessions naraya_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_sessions
    ADD CONSTRAINT naraya_sessions_pkey PRIMARY KEY (id);


--
-- Name: naraya_sessions naraya_sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_sessions
    ADD CONSTRAINT naraya_sessions_token_hash_key UNIQUE (token_hash);


--
-- Name: naraya_user_settings naraya_user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_user_settings
    ADD CONSTRAINT naraya_user_settings_pkey PRIMARY KEY (user_id);


--
-- Name: naraya_users naraya_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_users
    ADD CONSTRAINT naraya_users_pkey PRIMARY KEY (id);


--
-- Name: naraya_users naraya_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_users
    ADD CONSTRAINT naraya_users_username_key UNIQUE (username);


--
-- Name: naraya_comments_chapter_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_comments_chapter_idx ON public.naraya_comments USING btree (chapter_slug, created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: naraya_comments_chapter_root_cursor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_comments_chapter_root_cursor_idx ON public.naraya_comments USING btree (chapter_slug, created_at DESC, id DESC) WHERE ((deleted_at IS NULL) AND (parent_id IS NULL));


--
-- Name: naraya_comments_comic_chapter_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_comments_comic_chapter_idx ON public.naraya_comments USING btree (comic_slug, chapter_slug, created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: naraya_comments_comic_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_comments_comic_idx ON public.naraya_comments USING btree (comic_slug, created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: naraya_comments_parent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_comments_parent_idx ON public.naraya_comments USING btree (parent_id, created_at) WHERE (deleted_at IS NULL);


--
-- Name: naraya_comments_parent_latest_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_comments_parent_latest_idx ON public.naraya_comments USING btree (parent_id, created_at DESC, id DESC) WHERE (deleted_at IS NULL);


--
-- Name: naraya_comments_target_root_cursor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_comments_target_root_cursor_idx ON public.naraya_comments USING btree (comic_slug, chapter_slug, created_at DESC, id DESC) WHERE ((deleted_at IS NULL) AND (parent_id IS NULL));


--
-- Name: naraya_comments_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_comments_user_created_idx ON public.naraya_comments USING btree (user_id, created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: naraya_comments_user_cursor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_comments_user_cursor_idx ON public.naraya_comments USING btree (user_id, created_at DESC, id DESC) WHERE (deleted_at IS NULL);


--
-- Name: naraya_library_bookmark_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_library_bookmark_idx ON public.naraya_library_items USING btree (user_id, is_bookmarked, updated_at DESC);


--
-- Name: naraya_library_favorite_kind_cursor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_library_favorite_kind_cursor_idx ON public.naraya_library_items USING btree (user_id, content_kind, updated_at DESC, id DESC) WHERE (is_bookmarked = true);


--
-- Name: naraya_library_favorite_target_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_library_favorite_target_user_idx ON public.naraya_library_items USING btree (comic_slug, user_id) WHERE (is_bookmarked = true);


--
-- Name: naraya_library_history_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_library_history_idx ON public.naraya_library_items USING btree (user_id, status, updated_at DESC);


--
-- Name: naraya_library_history_kind_status_cursor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_library_history_kind_status_cursor_idx ON public.naraya_library_items USING btree (user_id, content_kind, status, updated_at DESC, id DESC) WHERE ((status <> 'planned'::text) OR (progress_percent > 0));


--
-- Name: naraya_library_user_kind_updated_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_library_user_kind_updated_idx ON public.naraya_library_items USING btree (user_id, content_kind, updated_at DESC);


--
-- Name: naraya_library_user_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_library_user_status_idx ON public.naraya_library_items USING btree (user_id, status);


--
-- Name: naraya_library_user_updated_cursor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_library_user_updated_cursor_idx ON public.naraya_library_items USING btree (user_id, updated_at DESC, id DESC);


--
-- Name: naraya_library_user_updated_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_library_user_updated_idx ON public.naraya_library_items USING btree (user_id, updated_at DESC);


--
-- Name: naraya_love_target_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_love_target_idx ON public.naraya_love_items USING btree (target_slug, created_at DESC);


--
-- Name: naraya_love_target_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_love_target_user_idx ON public.naraya_love_items USING btree (target_slug, user_id);


--
-- Name: naraya_love_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_love_user_created_idx ON public.naraya_love_items USING btree (user_id, created_at DESC);


--
-- Name: naraya_sessions_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_sessions_active_idx ON public.naraya_sessions USING btree (token_hash, expires_at) WHERE (revoked_at IS NULL);


--
-- Name: naraya_sessions_active_lookup_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_sessions_active_lookup_idx ON public.naraya_sessions USING btree (token_hash) INCLUDE (user_id, expires_at) WHERE (revoked_at IS NULL);


--
-- Name: naraya_sessions_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX naraya_sessions_user_idx ON public.naraya_sessions USING btree (user_id, created_at DESC);


--
-- Name: naraya_users_email_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX naraya_users_email_unique_idx ON public.naraya_users USING btree (lower(email)) WHERE (email <> ''::text);


--
-- Name: naraya_users_username_lower_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX naraya_users_username_lower_unique_idx ON public.naraya_users USING btree (lower(username));


--
-- Name: naraya_library_items naraya_favorite_counts_decrement_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER naraya_favorite_counts_decrement_trigger AFTER DELETE ON public.naraya_library_items FOR EACH ROW EXECUTE FUNCTION public.naraya_favorite_counts_decrement();


--
-- Name: naraya_library_items naraya_favorite_counts_increment_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER naraya_favorite_counts_increment_trigger AFTER INSERT ON public.naraya_library_items FOR EACH ROW EXECUTE FUNCTION public.naraya_favorite_counts_increment();


--
-- Name: naraya_library_items naraya_favorite_counts_update_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER naraya_favorite_counts_update_trigger AFTER UPDATE OF is_bookmarked ON public.naraya_library_items FOR EACH ROW EXECUTE FUNCTION public.naraya_favorite_counts_update();


--
-- Name: naraya_love_items naraya_love_counts_decrement_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER naraya_love_counts_decrement_trigger AFTER DELETE ON public.naraya_love_items FOR EACH ROW EXECUTE FUNCTION public.naraya_love_counts_decrement();


--
-- Name: naraya_love_items naraya_love_counts_increment_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER naraya_love_counts_increment_trigger AFTER INSERT ON public.naraya_love_items FOR EACH ROW EXECUTE FUNCTION public.naraya_love_counts_increment();


--
-- Name: naraya_comments naraya_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_comments
    ADD CONSTRAINT naraya_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.naraya_comments(id) ON DELETE CASCADE;


--
-- Name: naraya_comments naraya_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_comments
    ADD CONSTRAINT naraya_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.naraya_users(id) ON DELETE CASCADE;


--
-- Name: naraya_library_items naraya_library_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_library_items
    ADD CONSTRAINT naraya_library_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.naraya_users(id) ON DELETE CASCADE;


--
-- Name: naraya_love_items naraya_love_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_love_items
    ADD CONSTRAINT naraya_love_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.naraya_users(id) ON DELETE CASCADE;


--
-- Name: naraya_sessions naraya_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_sessions
    ADD CONSTRAINT naraya_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.naraya_users(id) ON DELETE CASCADE;


--
-- Name: naraya_user_settings naraya_user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.naraya_user_settings
    ADD CONSTRAINT naraya_user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.naraya_users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict qtobQfrpylfpVTkV94zFzkNcCJmAuJMd3oI3sGkDrUK0YJNqpGbHJcdttYZAZqv

