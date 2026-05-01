DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'Role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE "public"."users"
      ADD COLUMN "role" "public"."Role" NOT NULL DEFAULT 'USER';
  END IF;
END $$;
