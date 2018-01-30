git config core.autocrlf false
git rm --cached -r .

npm install --global yarn
npm install yarn

scripts\npm.bat install --arch=x64

node .\node_modules\gulp\bin\gulp.js compile

node .\node_modules\gulp\bin\gulp.js install-SqlToolsService

node .\node_modules\gulp\bin\gulp.js electron-x64
