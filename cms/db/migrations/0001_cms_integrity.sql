-- Custom invariants not represented by Drizzle Kit snapshots. Keep this
-- append-only alongside generated DDL; do not replace migrations with db push.
CREATE FUNCTION cms_guard_post_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.collection IS DISTINCT FROM OLD.collection
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'post identity is immutable' USING ERRCODE = '23514';
  END IF;
  IF OLD.first_published_at IS NOT NULL AND (
    NEW.first_published_at IS DISTINCT FROM OLD.first_published_at
    OR NEW.slug IS DISTINCT FROM OLD.slug
  ) THEN
    RAISE EXCEPTION 'first publication permanently locks the slug' USING ERRCODE = '23514';
  END IF;
  IF OLD.first_published_at IS NULL AND NEW.first_published_at IS NOT NULL
    AND NEW.published_revision_id IS NULL THEN
    RAISE EXCEPTION 'first publication requires a published revision' USING ERRCODE = '23514';
  END IF;
  IF NEW.version::bigint <> OLD.version::bigint + 1 THEN
    RAISE EXCEPTION 'post version must advance exactly once' USING ERRCODE = '23514';
  END IF;
  IF NEW.draft_version <> OLD.draft_version
    AND NEW.draft_version::bigint <> OLD.draft_version::bigint + 1 THEN
    RAISE EXCEPTION 'draft version must advance exactly once' USING ERRCODE = '23514';
  END IF;
  IF (NEW.draft IS DISTINCT FROM OLD.draft
    OR NEW.draft_schema_version IS DISTINCT FROM OLD.draft_schema_version)
    AND NEW.draft_version::bigint <> OLD.draft_version::bigint + 1 THEN
    RAISE EXCEPTION 'draft changes require a new draft version' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER posts_guard_update BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION cms_guard_post_update();
--> statement-breakpoint
CREATE FUNCTION cms_reject_immutable_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'immutable CMS record cannot be changed or deleted' USING ERRCODE = '23514';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER revisions_immutable BEFORE UPDATE OR DELETE ON revisions
FOR EACH ROW EXECUTE FUNCTION cms_reject_immutable_change();
--> statement-breakpoint
CREATE TRIGGER publication_operations_no_delete BEFORE DELETE ON publication_operations
FOR EACH ROW EXECUTE FUNCTION cms_reject_immutable_change();
--> statement-breakpoint
CREATE FUNCTION cms_guard_publication_receipt() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (to_jsonb(NEW) - ARRAY['sync_status', 'attempts', 'next_attempt_at', 'last_attempt_at', 'synced_at'])
    IS DISTINCT FROM
    (to_jsonb(OLD) - ARRAY['sync_status', 'attempts', 'next_attempt_at', 'last_attempt_at', 'synced_at']) THEN
    RAISE EXCEPTION 'publication receipt identity and result are immutable' USING ERRCODE = '23514';
  END IF;
  IF NEW.attempts < OLD.attempts OR (OLD.sync_status = 'synced' AND NEW IS DISTINCT FROM OLD) THEN
    RAISE EXCEPTION 'publication sync progress cannot move backwards' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER publication_operations_guard_update BEFORE UPDATE ON publication_operations
FOR EACH ROW EXECUTE FUNCTION cms_guard_publication_receipt();
