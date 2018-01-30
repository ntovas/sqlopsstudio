git config core.autocrlf false
git rm --cached -r .
# install chocolatey
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"


choco uninstall yarn -y -f

choco install yarn -y -f
type C:\ProgramData\chocolatey\logs\chocolatey.log

WHERE yarn

SET "PATH=%PATH%;%ProgramFiles(x86)%\yarn;%ProgramFiles%\yarn"

refreshenv

scripts/npm.bat install --arch=x64

node .\node_modules\gulp\bin\gulp.js compile

node .\node_modules\gulp\bin\gulp.js install-SqlToolsService

node .\node_modules\gulp\bin\gulp.js electron-x64
