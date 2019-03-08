 #!/bin/bash

PACKAGE_JSON_PATH=`pwd`/package.json
PRETTIER_RC_PATH=`pwd`/.prettierrc
ESLINT_RC_PATH=`pwd`/.eslintrc.js
GIT_IGNORE_PATH=`pwd`/.gitignore

if [ -e $PACKAGE_JSON_PATH ]; then
    echo "Since package.json already exists, initialization processing is terminated."
    exit -1
fi

if [ -e $PRETTIER_RC_PATH ]; then
    echo "Since .prettierrc already exists, initialization processing is terminated."
    exit -1
fi

if [ -e $GIT_IGNORE_PATH ]; then
    echo "Since .gitignore already exists, initialization processing is terminated."
    exit -1
fi

echo CWD=`pwd`
read -p "Are you sure you want to initialize this directory for the typescript project? [Y/n]" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
:
else
    echo "Canceled (>︿<｡)"
    exit
fi

echo
echo "Initiate... φ(•ᴗ•๑)"

PACKAGE_JSON=$(curl https://raw.githubusercontent.com/mironal/create-ts-project/master/package.json)
PRETTIER_RC=$(cat << EOS
{
  "semi": false,
  "trailingComma": "all"
}
EOS
)

ESLINT_RC=$(cat << EOS
module.exports = {
  "extends": "eslint:recommended",
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "sourceType": "module",
    "project": "./tsconfig.json"
  }
}
EOS
)

echo

echo "curl -s https://raw.githubusercontent.com/github/gitignore/master/Node.gitignore"
curl -s https://raw.githubusercontent.com/github/gitignore/master/Node.gitignore > $GIT_IGNORE_PATH
echo \"$GIT_IGNORE_PATH\" created
echo

echo $PACKAGE_JSON > $PACKAGE_JSON_PATH
echo \"$PACKAGE_JSON_PATH\" created
echo

echo $PRETTIER_RC > $PRETTIER_RC_PATH
echo \"$PRETTIER_RC_PATH\" created
echo

echo $ESLINT_RC > $ESLINT_RC_PATH
echo \"$ESLINT_RC_PATH\" created
echo

mkdir -p src
touch src/index.ts
touch src/index.test.ts

echo "Install dependencies (っ'ヮ'c)"

npm install
node_modules/.bin/tsc --init
node_modules/.bin/jest --init
npm run fmt
npm outdated

echo "Finished (੭•̀ᴗ•̀)"
