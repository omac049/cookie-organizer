# Cookie Organizer Chrome Extension

A powerful Chrome extension for managing and analyzing browser cookies with a user-friendly interface.

## Features

- **Real-time Cookie Scanning**: Scan and display all cookies from the current site
- **Smart Cookie Categorization**:
  - By purpose (necessary, preferences, analytics, marketing, social, unknown)
  - By relationship to the site (primary, secondary, third-party)
- **Comprehensive Cookie Information**:
  - Full cookie details (domain, path, expiration, value)
  - Security attributes (secure, httpOnly, session)
- **Cookie Management**:
  - One-click cookie deletion
  - Export cookie data as JSON
- **Intuitive Interface**:
  - Tabbed organization by purpose, relationship, or all cookies
  - Search functionality for quick cookie lookup
  - Visual indicators for different cookie types
  - Statistical overview of cookie usage

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store (link to be added)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extension directory
5. The extension should now appear in your browser toolbar

## Usage

1. Click the Cookie Organizer icon in your browser toolbar while on any website
2. The popup will display cookies associated with the current site
3. Use the tabs to view cookies organized by purpose or relationship
4. Search for specific cookies using the search box
5. Click on category headers to expand/collapse cookie lists
6. Use the "Delete" button to remove individual cookies
7. Use the "Export" button to download cookie data as JSON

## Privacy

Cookie Organizer works entirely within your browser. It does not:
- Send your cookie data to any external servers
- Share any browsing information with third parties
- Require any special permissions beyond what's needed for its functionality

## Development

### Project Structure
- `manifest.json`: Extension configuration
- `popup.html`: User interface structure
- `popup.js`: UI interaction and rendering logic
- `background.js`: Core functionality and cookie processing
- `icons/`: Extension icons in various sizes

### Building From Source
1. Clone the repository
2. Install dependencies (if any): `npm install`
3. Load the extension in developer mode as described in the installation section

## License

This project is released under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

