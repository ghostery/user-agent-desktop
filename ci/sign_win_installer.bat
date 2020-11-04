SET CLZ_SIGNTOOL_PATH=%TOOLTOOL_DIR%\vs2017_15.9.10\SDK\bin\10.0.17763.0\x64\signtool.exe
SET BUILD_SHELL=c:\mozilla-build\start-shell.bat
SET APP_NAME=Ghostery
SET lang=en-US
SET timestamp_server_sha1=http://timestamp.verisign.com/scripts/timstamp.dll
SET timestamp_server_sha256=http://sha256timestamp.ws.symantec.com/sha256/timestamp

"%CLZ_SIGNTOOL_PATH%" sign /t %timestamp_server_sha1% /f %WIN_CERT% /p %WIN_CERT_PASS% dist\install\sea\%APP_NAME%-%ff_exe%.%platform_prefix%.installer%STUB_PREFIX%.exe
"%CLZ_SIGNTOOL_PATH%" sign /fd sha256 /tr %timestamp_server_sha256% /td sha256 /f %WIN_CERT% /p %WIN_CERT_PASS% /as dist\install\sea\%APP_NAME%-%ff_exe%.%platform_prefix%.installer%STUB_PREFIX%.exe
"%CLZ_SIGNTOOL_PATH%" verify /pa dist\install\sea\%APP_NAME%-%ff_exe%.%platform_prefix%.installer%STUB_PREFIX%.exe
if ERRORLEVEL 1 (goto :error)

goto :eof

:error
exit /b 1
