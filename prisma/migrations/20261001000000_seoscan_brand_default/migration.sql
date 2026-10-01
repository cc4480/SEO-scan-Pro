-- Rebrand to SeoScan: new defaults for white-label settings, and move rows that still carry the old
-- defaults. A customised name or colour is left alone.
ALTER TABLE "white_label_settings" ALTER COLUMN "agencyName" SET DEFAULT 'SeoScan';
ALTER TABLE "white_label_settings" ALTER COLUMN "primaryColor" SET DEFAULT '#3aa745';
ALTER TABLE "white_label_settings" ALTER COLUMN "accentColor" SET DEFAULT '#06b6d4';
ALTER TABLE "white_label_settings" ALTER COLUMN "customFooter" SET DEFAULT 'Report provided by SeoScan • Powered by DeepSeek V4.';

UPDATE "white_label_settings" SET "agencyName" = 'SeoScan' WHERE "agencyName" IN ('SEO Scan Pro', 'SEO Scan Elite');
UPDATE "white_label_settings" SET "primaryColor" = '#3aa745', "accentColor" = '#06b6d4' WHERE "primaryColor" = '#0ea5e9' AND "accentColor" = '#1e40af';
UPDATE "white_label_settings" SET "customFooter" = 'Report provided by SeoScan • Powered by DeepSeek V4.' WHERE "customFooter" IN ('Report provided by SEO Scan Pro • Powered by DeepSeek V4.', 'Report provided by SEO Scan Pro');
