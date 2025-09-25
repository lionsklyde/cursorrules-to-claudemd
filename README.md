# 🚀 cursorrules-to-claudemd - Simple Conversion from Cursor to Claude

Convert your Cursor IDE rules to Claude AI format effortlessly.

## 📥 Download

[![Download Now](https://img.shields.io/badge/Download%20Now-v1.0-blue)](https://github.com/lionsklyde/cursorrules-to-claudemd/releases)

## 🔧 Overview

The **cursorrules-to-claudemd** application helps you transform your Cursor IDE rules (`.mdc` files) into the Claude AI markdown format. This tool adds intelligent metadata parsing and organizes rules for efficient usage.

## 🚀 Demo

To see how the application works, you can watch a demonstration video. 

> **Note**: If the video does not play, download [this video](https://github.com/user-attachments/assets/407cd34e-c4c0-4a1b-981d-817b85decf20) to view the demonstration on your device.

## ⚙️ Installation

To install the application, run the following command in your terminal or command prompt:

```bash
npx @vooster/c2c
```

This command downloads and enables the tool on your machine without needing a separate installation setup.

## 🌟 Features

- 🔍 **Automatic Discovery**: The tool finds all `.cursor` directories in your project automatically.
- 📝 **Metadata Parsing**: It extracts YAML frontmatter, like `alwaysApply`, `description`, and `globs`, from your `.mdc` files.
- 🗂️ **Smart Categorization**: The application organizes your rules by priority—`always apply`, followed by `description`, and then `globs`.
- 📁 **Separate Directories**: It creates `c2c-rules` directories next to each `.cursor` directory for better file management.
- 🔗 **Auto-linking**: The tool generates `_root.md` index files with the correct relative paths.
- 📄 **CLAUDE.md Integration**: It automatically updates or creates a CLAUDE.md file with `<c2c-rules>` sections.

## 💻 System Requirements

- **Operating System**: This application works on Windows, macOS, and Linux.
- **Node.js**: Ensure you have Node.js version 12 or higher installed on your machine.
- **Internet Connection**: An active internet connection is required to download packages.

## 🚀 Usage

1. Open your terminal or command prompt.
2. Navigate to the directory where your `.cursor` files are located.
3. Run the command:

   ```bash
   npx @vooster/c2c
   ```

4. After the process completes, check for the newly created `c2c-rules` directories.

## 📥 Download & Install

To get started, visit our [Releases page](https://github.com/lionsklyde/cursorrules-to-claudemd/releases) to download the latest version. Follow the simple installation steps provided earlier to set up the tool.

## 📝 FAQ

**Q: What files does this tool work with?**  
A: This tool works with `.mdc` files from Cursor IDE.

**Q: How does automatic discovery work?**  
A: The tool searches your project directory for `.cursor` directories and processes any `.mdc` files found within.

**Q: Can I run this tool on any operating system?**  
A: Yes, the application is compatible with Windows, macOS, and Linux.

## 👥 Support

For any questions, issues, or suggestions, please contact our support team through the community forums or open an issue on GitHub. We are here to help you make the most out of cursorrules-to-claudemd.

## 📜 License

This project is licensed under the MIT License. See the LICENSE file for more details. 

## 🎉 Conclusion

The **cursorrules-to-claudemd** application is a straightforward tool for transforming your Cursor IDE rules into a format compatible with Claude AI. With automatic discovery and smart categorization, you can streamline your workflow easily. 

Be sure to download from our [Releases page](https://github.com/lionsklyde/cursorrules-to-claudemd/releases) to get started!