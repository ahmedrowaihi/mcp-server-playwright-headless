# MCP Server Playwright Headless

A Model Context Protocol server that provides browser automation capabilities using Playwright in headless mode with Firefox.

## Features

- 🌐 Full browser automation capabilities using Firefox in headless mode
- 📸 Screenshot capture of entire pages or specific elements
- 🖱️ Comprehensive web interaction (navigation, clicking, form filling)
- 📊 Console log monitoring
- 🔧 JavaScript execution in browser context
- 🖼️ Integrated image server for screenshot management

## Installation

### Using Docker

```bash
# Build the image
docker build -t mcp-playwright-headless .

# Run the container
docker run --rm --name mcp-playwright -e IMAGE_SERVER=http://host.docker.internal:3001 mcp-playwright-headless:1.3.0
```

## Configuration

### Environment Variables

The server supports the following environment variables:

- `IMAGE_SERVER`: URL of an external image server to upload screenshots to
- `IMAGE_SERVER_TOKEN`: Authentication token for the image server

## Components

### Tools

#### `browser_navigate`

Navigate to any URL in the browser

```javascript
{
  "url": "https://example.com"
}
```

#### `browser_screenshot`

Capture screenshots of the entire page or specific elements

```javascript
{
  "name": "screenshot-name",     // required: name for the screenshot
  "selector": "#element-id",     // optional: CSS selector for element screenshot
  "fullPage": false             // optional: capture full page, default: false
}
```

#### `browser_click`

Click elements on the page using CSS selector

```javascript
{
  "selector": "#button-id"
}
```

#### `browser_click_text`

Click elements on the page by their text content

```javascript
{
  "text": "Click me"
}
```

#### `browser_fill`

Fill out an input field

```javascript
{
  "selector": "#input-field",
  "value": "text to input"
}
```

#### `browser_select`

Select an option from a dropdown using CSS selector

```javascript
{
  "selector": "#dropdown",
  "value": "option-value"
}
```

#### `browser_select_text`

Select an option from a dropdown by its text content

```javascript
{
  "text": "Option Text",
  "value": "option-value"
}
```

#### `browser_hover`

Hover over elements on the page using CSS selector

```javascript
{
  "selector": "#menu-item"
}
```

#### `browser_hover_text`

Hover over elements on the page by their text content

```javascript
{
  "text": "Hover me"
}
```

#### `browser_evaluate`

Execute JavaScript in the browser context

```javascript
{
  "script": "document.querySelector('#element').innerText"
}
```

#### `delete_screenshot`

Delete a specific screenshot from the image server

```javascript
{
  "filename": "screenshot-name.png"
}
```

#### `clear_screenshots`

Clear all screenshots from the image server

```javascript
{
}
```

### Resources

#### `console://logs`

Access browser console logs captured during automation

## Image Server

The project includes a standalone image server for managing screenshots. To use it:

1. Build and start the image server:

```bash
# Build the image
docker build -t mcp-image-server -f image-server/Dockerfile .

# Run the container
docker run -d -p 3001:3001 --name image-server mcp-image-server:1.0.0
```

The image server provides automatic screenshot management with:

- Automatic upload of screenshots
- Screenshot deletion capabilities
- Bulk screenshot clearing
- Local fallback if image server is unavailable

## Error Handling

The server includes comprehensive error handling:

- Automatic retries for strict mode violations
- Fallback mechanisms for screenshot storage
- Detailed error messages for debugging

## License

MIT
