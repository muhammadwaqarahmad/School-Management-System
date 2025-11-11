# Configuration File

## How to Change School Name

To change the school name throughout the entire application, simply edit **`config.json`** file.

### Location
```
client/src/config/config.json
```

### Usage

1. **Open** `client/src/config/config.json`
2. **Change** the `schoolName` value to your desired school name
3. **Save** the file
4. The change will automatically reflect everywhere in the application!

### Example

```json
{
  "schoolName": "My School Name",
  "schoolNameFull": "My School Name Management System",
  "copyrightYear": "2025",
  "poweredBy": {
    "name": "Yuxor",
    "url": "https://yuxor.com"
  }
}
```

### Where It's Used

The school name from `config.json` is automatically used in:
- ✅ Page title (browser tab)
- ✅ Navbar (top navigation)
- ✅ Footer (copyright section)
- ✅ Login page header
- ✅ All other components that display the school name

### Config Properties

- **`schoolName`**: Short name used in headers and navigation
- **`schoolNameFull`**: Full name used in page title
- **`copyrightYear`**: Year displayed in copyright (optional, defaults to current year)
- **`poweredBy.name`**: Name of the company/developer
- **`poweredBy.url`**: URL for the "Powered by" link

### Important Notes

- Make sure JSON syntax is valid (use commas correctly)
- After changing, refresh the browser to see updates
- The config is imported at build time, so if using production build, rebuild the app

