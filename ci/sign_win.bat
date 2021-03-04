SET CQZ_WORKSPACE=%CD%
SET TOOLTOOL_DIR=c:\build
SET MOZ_FETCHES_DIR=c:\build
SET CLZ_SIGNTOOL_PATH=%TOOLTOOL_DIR%\vs2017_15.9.29\SDK\bin\10.0.17134.0\x64\signtool.exe
SET BUILD_SHELL=c:\mozilla-build\start-shell.bat
SET APP_NAME=Ghostery
SET lang=%1

ECHO cd $CQZ_WORKSPACE ^^^&^^^& ./ci/bootstrap_windows.sh | call %BUILD_SHELL%

set ff_version=''
set archivator_exe=c:\mozilla-build\bin\7z.exe
for /F %%f in (%CQZ_WORKSPACE%\mozilla-release\browser\config\version.txt) do set ff_version=%%f
set ff_exe=%ff_version%.en-US
echo %ff_exe%
if NOT "%lang%" == "" set ff_exe=%ff_version%.%lang%
echo %ff_exe%
echo %lang%

if exist %CQZ_WORKSPACE%\mozilla-release\obj-aarch64-windows-mingw32\dist\install\sea\%APP_NAME%-%ff_exe%.win64-aarch64.installer.exe (
  set platform_prefix=win64-aarch64
  cd %CQZ_WORKSPACE%\mozilla-release\obj-aarch64-windows-mingw32\
) else (
  set platform_prefix=win64
  cd %CQZ_WORKSPACE%\mozilla-release\obj-x86_64-pc-mingw32\
)

set timestamp_server_sha1=http://timestamp.digicert.com
set timestamp_server_sha256=http://sha256timestamp.ws.symantec.com/sha256/timestamp
echo %CLZ_SIGNTOOL_PATH%

if exist ./pkg%STUB_PREFIX%_%lang% rmdir /q /s "pkg%STUB_PREFIX%_%lang%"

dir /b %TOOLTOOL_DIR%
dir /b c:\mozilla-build

%archivator_exe% l dist\install\sea\%APP_NAME%-%ff_exe%.%platform_prefix%.installer%STUB_PREFIX%.exe
%archivator_exe% x -opkg%STUB_PREFIX%_%lang% -y dist\install\sea\%APP_NAME%-%ff_exe%.%platform_prefix%.installer%STUB_PREFIX%.exe
if not exist ./pkg%STUB_PREFIX%_%lang% (goto :error)
cd pkg%STUB_PREFIX%_%lang%
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

if defined STUB_PREFIX goto prepare_stub_installer
rem Prepare usual installer
del installer.7z
%archivator_exe% a -r -t7z installer.7z -mx -m0=BCJ2 -m1=LZMA:d25 -m2=LZMA:d19 -m3=LZMA:d1 -mb0:1 -mb0s1:2 -mb0s2:3
cd ..
copy /b ..\other-licenses\7zstub\firefox\7zSD.Win32.sfx + ..\browser\installer\windows\app.tag + pkg_%lang%\installer.7z dist\install\sea\%APP_NAME%-%ff_exe%.%platform_prefix%.installer.exe
goto sign_installer

:prepare_stub_installer
del stub.7z
copy setup-stub.exe setup.exe
%archivator_exe% a -t7z stub.7z setup.exe -mx -m0=BCJ2 -m1=LZMA:d21 -m2=LZMA:d17 -m3=LZMA:d17 -mb0:1 -mb0s1:2 -mb0s2:3
cd ..
copy /b ..\other-licenses\7zstub\firefox\7zSD.Win32.sfx + ..\browser\installer\windows\instgen\stub.tag + pkg%STUB_PREFIX%_%lang%\stub.7z dist\install\sea\%APP_NAME%-%ff_exe%.%platform_prefix%.installer-stub.exe

:sign_installer
"%CLZ_SIGNTOOL_PATH%" sign /t %timestamp_server_sha1% /f %WIN_CERT% /p %WIN_CERT_PASS% dist\install\sea\%APP_NAME%-%ff_exe%.%platform_prefix%.installer%STUB_PREFIX%.exe
"%CLZ_SIGNTOOL_PATH%" sign /fd sha256 /tr %timestamp_server_sha256% /td sha256 /f %WIN_CERT% /p %WIN_CERT_PASS% /as dist\install\sea\%APP_NAME%-%ff_exe%.%platform_prefix%.installer%STUB_PREFIX%.exe
"%CLZ_SIGNTOOL_PATH%" verify /pa dist\install\sea\%APP_NAME%-%ff_exe%.%platform_prefix%.installer%STUB_PREFIX%.exe
if ERRORLEVEL 1 (goto :error)

goto :eof

:error
exit /b 1
