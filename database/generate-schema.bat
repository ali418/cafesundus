@echo off
echo Generating schema.sql file...

REM Load environment variables from .env file
for /F "tokens=*" %%A in ('type ..\backend\.env') do (
    set %%A
)

REM Set default values if not found in .env
if not defined DB_NAME set DB_NAME=cafe_sundus
if not defined DB_USER set DB_USER=postgres
if not defined DB_PASSWORD set DB_PASSWORD=postgres
if not defined DB_HOST set DB_HOST=localhost
if not defined DB_PORT set DB_PORT=5432

REM Run pg_dump to generate schema.sql
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --schema-only --no-owner --no-privileges > schema.sql

echo Schema file generated at: %CD%\schema.sql