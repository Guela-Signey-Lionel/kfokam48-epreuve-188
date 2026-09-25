@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup script, version 3.3.2 (Windows)
@REM ----------------------------------------------------------------------------
@echo off
setlocal

set BASE_DIR=%~dp0
set WRAPPER_JAR=%BASE_DIR%.mvn\wrapper\maven-wrapper.jar
set WRAPPER_PROPERTIES=%BASE_DIR%.mvn\wrapper\maven-wrapper.properties
set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

if defined JAVA_HOME (
  set JAVA_EXE=%JAVA_HOME%\bin\java.exe
) else (
  set JAVA_EXE=java.exe
)

if not exist "%WRAPPER_JAR%" (
  echo Telechargement de maven-wrapper.jar...
  for /f "tokens=2 delims==" %%A in ('findstr /b "wrapperUrl=" "%WRAPPER_PROPERTIES%"') do set WRAPPER_URL=%%A
  powershell -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%'"
)

"%JAVA_EXE%" -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%BASE_DIR%" %WRAPPER_LAUNCHER% %*

endlocal
