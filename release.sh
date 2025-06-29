#! /bin/bash
name="meow-monitor"
port=16111
DIR=$(cd $(dirname $0) && pwd)
version="1.0.4"

allowMethods=("deb:install push delete build saki-ui")

setVersion() {
  echo "-> $version"
  sed -i "s/\"version\":.*$/\"version\":\"${version}\",/" ./package.json
}

push() {
  git tag v$version
  git push origin v$version
}

delete() {
  git tag -d v$version
  git push origin :refs/tags/v$version
}

build() {
  setVersion

  download:saki-ui
  yarn el:icon

  mkdir -p ./el-build/packages
  cp -r ./el-build/*.AppImage ./el-build/packages/
  cp -r ./el-build/*.deb ./el-build/packages/
  cp -r ./el-build/*.exe ./el-build/packages/

  rm -rf ./el-build/linux-unpacked
  rm -rf ./el-build/*.AppImage
  rm -rf ./el-build/*.deb
  rm -rf ./el-build/*.exe

  yarn el:tsc-no-watch

  # ===== Windows 部分改用 Docker 打包 =====
  echo "Building Windows (x64) using Docker..."
  docker run --rm -ti \
    -v "$(pwd)":/project \
    -v ~/.cache/electron:/root/.cache/electron \
    -v ~/.cache/electron-builder:/root/.cache/electron-builder \
    electronuserland/builder:wine \
    /bin/bash -c "cd /project && yarn el:build-win-x64 \
    && yarn el:build-linux-x64"

  # yarn el:build-win-x64

  # yarn el:build-linux-x64

  # 重命名 Windows 安装包
  mv "./el-build/Meow Monitor Setup "$version".exe" \
    ./el-build/$name-v$version-win-x64.exe

  # 重命名 Linux 安装包
  mv "./el-build/Meow Monitor-"$version".AppImage" \
    ./el-build/$name-v$version-linux-x64.AppImage
  mv "./el-build/meow-monitor_"$version"_amd64.deb" \
    ./el-build/$name-v$version-linux-amd64-x64.deb

  cpapp

  rm -rf ./el-build/*.exe.blockmap

}

cpapp() {
  mkdir -p /mnt/hgfs/BackupShare/Downloads/apps/$name
  cp -r $DIR/el-build/$name-v$version-* \
    /mnt/hgfs/BackupShare/Downloads/apps/$name

}

deb:install() {
  sudo apt remove -y ${name}
  sudo apt install -f -y ./el-build/*.deb
}

download:saki-ui() {
  wget https://saki-ui.aiiko.club/packages/saki-ui-v1.0.1.tgz
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
