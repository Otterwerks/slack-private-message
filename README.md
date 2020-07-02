# slack-private-message
A chrome extension allowing users to send private encrypted messages to each other over Slack.

Still a work in progress...

I had an idea to make this extension and found one already existed called Shhlack but I was unable to make it work. I got the idea to use CryptoJS for the encryption because I read that Shhlack used it. This is my take on a Slack message encryptor.

### How does it work?
This extension uses AES and a user chosen secret to encrypt and decrypt text. Users must set their own secret which is saved to localstorage.

A button is added that, when clicked, will take all text entered in the Slack message editor and replace it with an AES cipher text. A special indicator string is appended to the beginning of this text to mark the message as an encrypted message.

A DOM mutation observer watches for any new messages and checks for the encryption indicator string, then attempts to decrypt the cipher text using the same secret stored in localstorage.

### Installation
Clone this repository!

Prepare Chrome by enabling 'Developer Mode' for extensions: 
- Navigate to chrome://extensions/
- Toggle the 'Developer Mode' switch in the upper right corner to enable extra extension options

On the Chrome extensions page, chrome://extensions/, use the button 'Load unpacked' to add an extension from a local folder.

Browse to, and select this repository.

Make sure this extension is 'Pinned' to the toolbar by clicking on the puzzle piece extension icon in the upper right corner of Chrome and making sure the pin icon is checked next to SlackPM. This will add a SlackPM icon to the toolbar(needed to set the encryption secret).

### Usage
Click the SlackPM icon in the Chrome toolbar to set an encryption secret. You choose what you want the secret to be. It can be any text string and you'll need to coordinate with whomever you are messaging with so that everyone is using the same secret. Keep in mind anyone who finds out the secret will be able to decrypt messages that were encrypted using that secret.

**Make sure you have Slack open in your browser when you set the secret! The secret is saved to localstorage, which is isolated per url origin, so if the secret is set when you have a github tab active Slack will not have access to it.

This extension will add a button that reads 'Encrypt Message' down in the Slack message options bar. Type in your text and then use this button to encrypt your message. You can then choose to send your encrypted message, although it won't look encrypted to you.

All messages should automatically be decrypted and should display an indicator that they were sent using SlackPM.

### Commands
- `npm install` run inside the root directory to install dependencies
- `npm run build` use webpack to bundle the dependencies and content script into the main JS bundle