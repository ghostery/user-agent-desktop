SET CQZ_WORKSPACE=%CD%
SET TOOLTOOL_DIR=c:\build
SET CLZ_SIGNTOOL_PATH=%TOOLTOOL_DIR%\vs2017_15.9.29\SDK\bin\10.0.17134.0\x64\signtool.exe
SET BUILD_SHELL=c:\mozilla-build\start-shell.bat
set timestamp_server_sha1=http://timestamp.digicert.com
set timestamp_server_sha256=http://sha256timestamp.ws.symantec.com/sha256/timestamp

rem Ensure SDK signing tools are available
ECHO cd $CQZ_WORKSPACE ^^^&^^^& ./ci/bootstrap_windows.sh | call %BUILD_SHELL%

rem Enter a directory and sign everything
cd %1

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
