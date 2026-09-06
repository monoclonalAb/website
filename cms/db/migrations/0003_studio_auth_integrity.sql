-- Append-only auth record guards. These do not verify WebAuthn, authorize
-- enrollment, or replace locked/conditional writes in the future auth service.
CREATE FUNCTION cms_guard_studio_owner() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.webauthn_user_id IS DISTINCT FROM OLD.webauthn_user_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'studio owner identity is immutable' USING ERRCODE = '23514';
  END IF;
  IF NEW.auth_version <> OLD.auth_version
    AND NEW.auth_version::bigint <> OLD.auth_version::bigint + 1 THEN
    RAISE EXCEPTION 'auth version must advance exactly once' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER studio_owner_guard_update BEFORE UPDATE ON studio_owner
FOR EACH ROW EXECUTE FUNCTION cms_guard_studio_owner();
--> statement-breakpoint
CREATE FUNCTION cms_guard_studio_credential() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (to_jsonb(NEW) - ARRAY['counter', 'transports', 'backed_up', 'revoked_at'])
    IS DISTINCT FROM
    (to_jsonb(OLD) - ARRAY['counter', 'transports', 'backed_up', 'revoked_at']) THEN
    RAISE EXCEPTION 'credential identity and key are immutable' USING ERRCODE = '23514';
  END IF;
  IF NEW.counter < OLD.counter OR (OLD.revoked_at IS NOT NULL AND NEW IS DISTINCT FROM OLD) THEN
    RAISE EXCEPTION 'credential counter or revocation cannot move backwards' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER studio_credentials_guard_update BEFORE UPDATE ON studio_credentials
FOR EACH ROW EXECUTE FUNCTION cms_guard_studio_credential();
--> statement-breakpoint
CREATE FUNCTION cms_guard_studio_session() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (to_jsonb(NEW) - 'revoked_at') IS DISTINCT FROM (to_jsonb(OLD) - 'revoked_at')
    OR (OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS DISTINCT FROM OLD.revoked_at) THEN
    RAISE EXCEPTION 'sessions can only be revoked, not rewritten or extended' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER studio_sessions_guard_update BEFORE UPDATE ON studio_sessions
FOR EACH ROW EXECUTE FUNCTION cms_guard_studio_session();
--> statement-breakpoint
CREATE FUNCTION cms_guard_studio_challenge() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (to_jsonb(NEW) - 'consumed_at') IS DISTINCT FROM (to_jsonb(OLD) - 'consumed_at')
    OR OLD.consumed_at IS NOT NULL OR NEW.consumed_at IS NULL THEN
    RAISE EXCEPTION 'challenges can only be consumed once, never rebound or reset' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER studio_challenges_guard_update BEFORE UPDATE ON studio_challenges
FOR EACH ROW EXECUTE FUNCTION cms_guard_studio_challenge();
