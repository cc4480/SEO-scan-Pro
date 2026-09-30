-- Emails are now stored lowercase (see lib/validation.ts). Normalise existing rows so the unique
-- index means "one account per mailbox". Refuse to run if two accounts differ only by case:
-- merging people's accounts is not something a migration should decide.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "users" GROUP BY lower("email") HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Accounts exist whose emails differ only by case; resolve them by hand before migrating';
  END IF;
END $$;

UPDATE "users" SET "email" = lower("email") WHERE "email" <> lower("email");
UPDATE "email_verification_tokens" SET "email" = lower("email") WHERE "email" <> lower("email");
