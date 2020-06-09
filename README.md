# Cabal Desktop

> Desktop client for cabal, the p2p/decentralized/offline-first chat platform.

<center><img width="1552" alt="Screen Shot 2020-06-05 at 10 29 00 AM" src="https://user-images.githubusercontent.com/40796/83952659-2314ec80-a808-11ea-8074-619ece6201e3.png"></center>

## Install

### Download the latest release

https://github.com/cabal-club/cabal-desktop/releases/

### Build from source

```
$ git clone https://github.com/cabal-club/cabal-desktop
$ cd cabal-desktop

$ yarn install             # install dependencies
$ yarn start               # start the application
```

### Download from AUR
https://aur.archlinux.org/packages/cabal-desktop-git/

### Updating MacOS DMG background image
```
tiffutil -cathidpicheck cabal-desktop-dmg-background.jpg cabal-desktop-dmg-background@2x.jpg -out dmg-background.tiff
```

## Distribute

TravisCI will automatically create and upload the appropriate release packages
for you when you're ready to release. Here's the process for distributing 
production builds.

1. Draft a new release. Set the “Tag version” to the value of version in your
application package.json, and prefix it with v. “Release title” can be anything
you want. For example, if your application package.json version is 1.0, your draft’s
“Tag version” would be v1.0.

2. Push some commits. Every CI build will update the artifacts attached to this
   draft.

3. Once you are done, create the tag (e.g., `git tag v6.0.0`) and publish the release (`git push --tags && npm publish`). GitHub will tag
   the latest commit for you.

The benefit of this workflow is that it allows you to always have the latest
artifacts, and the release can be published once it is ready.


Build for current platform:

```
$ yarn run dist
```

build for [multiple platforms](https://www.electron.build/multi-platform-build#docker):

```
$ ./bin/build-multi
```

## How to Contribute

### Formatting Rules

This repository is formatted with [StandardJS](https://standardjs.com/) (there is a [vscode](https://marketplace.visualstudio.com/items?itemName=chenxsan.vscode-standardjs) plugin).
