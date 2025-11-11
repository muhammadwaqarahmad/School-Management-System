-- AlterTable: Add historicalSession to Fee table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Fee' AND column_name = 'historicalSession'
    ) THEN
        ALTER TABLE "Fee" ADD COLUMN "historicalSession" TEXT;
    END IF;
END $$;
