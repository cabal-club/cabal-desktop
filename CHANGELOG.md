# Changelog

All notable changes to this project will be documented in this file.

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