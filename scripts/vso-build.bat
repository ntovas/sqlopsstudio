git config core.autocrlf false
git rm --cached -r .
# install chocolatey
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"

DEL C:\ProgramData\chocolatey\logs\chocolatey.log /f

choco uninstall yarn -y -f -v

choco install yarn -y -f -v

type C:\ProgramData\chocolatey\logs\chocolatey.log

WHERE yarn

ECHO %CD%


SET "PATH=%PATH%;%ProgramFiles(x86)%\yarn;%ProgramFiles%\yarn"

ECHO %AGENT_HOMEDIRECTORY%
ECHO %AGENT_BUILDDIRECTORY%
ECHO %AGENT_WORKFOLDER%

DIR  %AGENT_WORKFOLDER%\_temp
DIR  %AGENT_WORKFOLDER%\_temp\chocolatey
DIR  %AGENT_WORKFOLDER%\_temp\chocolatey\yarn
DIR  %AGENT_WORKFOLDER%\_temp\chocolatey\yarn\1.3.2
TYPE  %AGENT_WORKFOLDER%\_temp\chocolatey\yarn\yarn.MsiInstall.log

DIR C:\ProgramData

scripts/npm.bat install --arch=x64

node .\node_modules\gulp\bin\gulp.js compile

node .\node_modules\gulp\bin\gulp.js install-SqlToolsService

node .\node_modules\gulp\bin\gulp.js electron-x64
