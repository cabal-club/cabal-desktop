# Changelog

All notable changes to this project will be documented in this file.

## [3.1.0] - 2019-07-?
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