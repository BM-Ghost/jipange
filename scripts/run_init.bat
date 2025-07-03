@echo off
set PGPASSWORD=npg_Sw9fnpUvu6bW

REM Run the SQL script and log both output and errors
psql -h ep-still-mountain-a4364b3p-pooler.us-east-1.aws.neon.tech -U neondb_owner -d neondb -f init-database.sql > output.log 2>&1

REM Show message
echo Done running init-database.sql. Output and errors saved in output.log
pause
