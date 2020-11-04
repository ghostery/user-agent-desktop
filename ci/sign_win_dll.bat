SET CQZ_WORKSPACE=%CD%
SET TOOLTOOL_DIR=c:\build
SET MOZ_FETCHES_DIR=c:\build
SET CLZ_SIGNTOOL_PATH=%TOOLTOOL_DIR%\vs2017_15.9.10\SDK\bin\10.0.17763.0\x64\signtool.exe
SET BUILD_SHELL=c:\mozilla-build\start-shell.bat
SET APP_NAME=Ghostery
SET lang=en-US

ECHO cd $CQZ_WORKSPACE ^^^&^^^& ./ci/bootstrap_windows.sh | call %BUILD_SHELL%
cd %CQZ_WORKSPACE%\mozilla-release\obj-x86_64-pc-mingw32\

set ff_version=''
set archivator_exe=c:\mozilla-build\bin\7z.exe
for /F %%f in (..\browser\config\version.txt) do set ff_version=%%f
set ff_exe=%ff_version%.en-US
echo %ff_exe%
if NOT "%lang%" == "" set ff_exe=%ff_version%.%lang%
echo %ff_exe%
echo %lang%

set timestamp_server_sha1=http://timestamp.verisign.com/scripts/timstamp.dll
set timestamp_server_sha256=http://sha256timestamp.ws.symantec.com/sha256/timestamp
echo %CLZ_SIGNTOOL_PATH%

SET platform_prefix=win64

dir /b %TOOLTOOL_DIR%
dir /b c:\mozilla-build

cd dist\%APP_NAME%
for /R %%f in (
  *.exe *.dll
) do (
  rem Check does file already have a digital sign. If not - try to create one
  echo Check and sign %%f
  "%CLZ_SIGNTOOL_PATH%" verify /pa %%f
  if ERRORLEVEL 1 (
    "%CLZ_SIGNTOOL_PATH%" sign /t %timestamp_server_sha1% /f %WIN_CERT% /p %WIN_CERT_PASS% %%f
    "%CLZ_SIGNTOOL_PATH%" sign /fd sha256 /tr %timestamp_server_sha256% /td sha256 /f %WIN_CERT% /p %WIN_CERT_PASS% /as %%f
    "%CLZ_SIGNTOOL_PATH%" verify /pa %%f
  )
  if ERRORLEVEL 1 (goto :error)
)

goto :eof

:error
exit /b 1
