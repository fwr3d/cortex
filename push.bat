@echo off
setlocal

git status
git add -A

set /p msg=Commit message:
if "%msg%"=="" set msg=Update

git commit -m "%msg%"
git push

endlocal