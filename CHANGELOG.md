# Changelog

All notable changes to this project will be documented in this file.

## [6.0.2] - 2020-06-11
### Added
- Added support for adding cabals using domain names.
### Fixed
- Fixed bug related to adding new cabals.

## [6.0.1] - 2020-06-08
### Added
- Added autoupdate feature to automatically install new releases.

## [6.0.0] - 2020-06-07
### Fixed
- Update to latest `cabal-client` to fix connections to peers who require holepunching.

## [5.1.0] - 2020-06-06
### Added
- Added basic moderation features for hiding users and setting moderators and admins.
- Added indicator for unread messages in collapsed channels list.
- Optimized incoming message handling.
- Added a dark mode theme.
### Fixed
- Fixed desktop notifications appearing from channels you have not joined. 

## [5.0.5] - 2020-05-19
### Added
- Added "starred/favorite" channels list.
- Clicking the star next to a channels name in the header will add it to the starred list.
- Added toggles to the channel and peers lists to hide or show them.
- Clicking usernames will now show a profile panel with info about the user.
- Added initial support for right-click context menus.
- Added a custom font.
- Added an indicator when there are newer messages in the message list.
- MacOS builds are now signed and notarized reducing warnings during install.
- MacOS DMG builds now have a custom background.
- Added keyboard commands for cmd+arrow to navigate channels and cabals.
- Avatars are now generated based on the user's unique key.
### Fixed
- Fixed issue crash on username change on new cabals.
- Fixed bug in removing cabals.
- Fixed issue causing message list to incorrectly jump back in time.
- Fixed issue preventing desktop notifications.
- Fixed message parsing for urls and markdown.

## [5.0.4] - 2020-05-07
### Fixed
- Fixed issue with missing icon.

## [5.0.3] - 2020-05-05
### Fixed
- Fixed bug in removing cabals.
### Added
- Added slash command handling from `cabal-client`.
- Improved loading screen experience.
- Duplicated nicks are now shown as one.

## [5.0.2] - 2020-04-21
### Fixed
- Fixed additional performance issues in event handling.
### Added
- Added a loading screen while cabals initialize to reduce UI flashing.
- Updated to Electron 7.

## [5.0.1] - 2020-04-12
### Fixed
- Fixed performance issues in event handling.

## [5.0.0] - 2020-04-10
### Added
- Updated to latest `cabal-client` which now uses `hyperswarm` for connecting to peers.
  This is a breaking change and all clients will need to update to a client 
  that supports hyperswarm to continuing peering.

## [4.1.0] - 2020-02-09
### Added
- Implemented `cabal-client` into Cabal Desktop.
- Added joining and leaving channels feature.
- Added channel browser interface.
- Improved unread message handling.
- Added version number to UI.
- Added a random nickname generator for the initiator a new cabal.
- MacOS: Cabal Desktop will continue running when all windows have closed.
### Fixed
- Desktop notifications are now throttled so not to flood you on startup.
- Fixed message layout and style issues.

## [4.0.0] - 2019-11-30
### Added
- Improved message rendering speed.
- Added keyboard shortcuts to switch between cabals.
- Added UI to indicate and divide date changes between messages.
### Fixed
- Upgraded to cabal-core @ 9.

## [3.1.1] - 2019-08-09
### Fixed
- Upgraded to latest cabal-core / multifeed

## [3.1.0] - 2019-07-26
### Added
- Upgraded to Electron 5
- Toggle previous and next channels with cmd/ctr-n and cmd/ctr-p key combo.
- Added setting screen for each cabal.
- Added toggle for enabling desktop notifications (they're off by default now).
- Added join button to create cabal UI.
- Window position and size are remembered between sessions.
- Fix navigation to other cabal after deleting a cabal.
- Added new message indicator to cabals list.
- Added new message indicator badge to application icon (MacOS/Linux only).
- Added feature to set an alias locally to give cabals friendly names in the UI.
### Fixed
- Travis CI integration. it builds automatically now!
- `/remove` command works again.
- Navigate to cabal when adding a cabal address that already exists in the client.
- Fixed jumpy message list scrolling when new messages arrive.
- Fixed broken unread message indicators on channels.
- Fixed large image embeds from taking up too much space.
- Adjusted unordered lists margin to be more reasonable.
- Emoji picker works again

## [3.0.0] - 2019-07-03
### Fixed
- Tab completion of usernames and slash commands.
- After switching cabals, posting a message will now send to the correct channel.

### Added
- Upgraded to cabal-core@6 - this is a breaking change
- Updated and added styling for Markdown rendering, including: `<blockquote>` and headings.

## [2.0.3] - 2019-06-18
### Added
- UI to show and set channel topics.
- Display currently connected peer count.
- Settings screen for future features and a button to remove the cabal from the client.
- Slash commands for `/help`, `/join`/`/j`, `/motd` (message of the day), `/nick`/`/n`, `/topic`, and `/remove` (for removing a cabal from the client).