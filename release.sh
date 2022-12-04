#! /bin/bash
name="meow-monitor"
port=16111
DIR=$(cd $(dirname $0) && pwd)
version="1.0.0"

allowMethods=("deb:install push delete build saki-ui")

push() {
  git tag v$version
  git push origin v$version
}

delete() {
  git tag -d v$version
  git push origin :refs/tags/v$version
}

build() {
  saki-ui
  yarn el:icon

  mkdir -p ./el-build/packages
  cp -r ./el-build/*.AppImage ./el-build/packages/
  cp -r ./el-build/*.deb ./el-build/packages/
  cp -r ./el-build/*.exe ./el-build/packages/

  rm -rf ./el-build/linux-unpacked
  rm -rf ./el-build/*.AppImage
  rm -rf ./el-build/*.deb
  rm -rf ./el-build/*.exe

  yarn el:build-win-x64
  # yarn el:build-linux-x64

  mv "./el-build/Meow Monitor Setup "$version".exe" \
    ./el-build/$name-v$version-win-x64.exe
  mv "./el-build/Meow Monitor-"$version".AppImage" \
    ./el-build/$name-v$version-linux-x64.AppImage
  mv "./el-build/meow-monitor-"$version"_amd64.deb" \
    ./el-build/$name-v$version-linux-amd64-x64.deb

  rm -rf ./el-build/*.exe.blockmap
}

deb:install() {
  sudo apt remove -y ${name}
  sudo apt install -f -y ./el-build/*.deb
}

saki-ui() {
  wget https://saki-ui.aiiko.club/saki-ui.tgz
  tar zxvf ./saki-ui.tgz -C ./public
  rm -rf ./saki-ui*
}

main() {
  if echo "${allowMethods[@]}" | grep -wq "$1"; then
    "$1"
  else
    echo "Invalid command: $1"
  fi
}

main "$1"
