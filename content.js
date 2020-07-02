// Initialization and Listeners
var CryptoJS = require("crypto-js"); //only for running webpack build
window.onload = function() {	
	const buttonGroup = document.getElementsByClassName("p-composer__body")
	const encryptButtonSource = '<button id="encryptButton" class="c-button-unstyled c-icon_button c-icon_button--light p-composer__button p-composer__button--sticky" style="margin-left:auto;padding-left:1em;padding-right:1em;width:10em;text-align:center;">Encrypt Message</button>'
	if (buttonGroup.length > 0) {
		buttonGroup[0].insertAdjacentHTML("beforeend", encryptButtonSource);
	};
	const encryptButton = document.getElementById("encryptButton")
	if (encryptButton != null) {
		encryptButton.addEventListener("click", encryptText);
	};

	const messagePane = document.getElementsByClassName("c-virtual_list__scroll_container")[1];
	const observerConfig = {attributes:true, childList:true, subtree:false, characterData:false};
	const observer = new MutationObserver(observerCallback);
	observer.observe(messagePane, observerConfig);

	const initialMessages = document.getElementsByClassName("c-virtual_list__item");
	setTimeout(function() {
		processNewMessages(initialMessages);
	}, 3000);
};

const observerCallback = function(mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
			processNewMessages(mutation.addedNodes);
        };
    };
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message === "addSecret") {
      var secret = request.value;
		addSecret(secret);
    };
  }
);

// Secret Management
const getSecrets = () => {
	return window.localStorage.getItem("slackpm_secret");
};

const addSecret = (secret) => {
    window.localStorage.setItem("slackpm_secret", secret);
};

// Encryption & Decryption
var currentMessage = "";
const encryptionIndicator = "<<!>>";

const encryptText = () => {
	const secret = getSecrets();
	const textField = document.getElementsByClassName("ql-editor")[0].firstChild;
	const message = textField.innerHTML;
	alert(message);
	if (message != currentMessage) {
		if (message == "") {
			return;
		};
		var encryptedMessage = CryptoJS.AES.encrypt(message, secret).toString();
		currentMessage = encryptionIndicator + encryptedMessage;
		textField.innerText = encryptionIndicator + encryptedMessage;
	} else {
		alert("This message has already been encrypted!");
	};
};

const decryptText = (encryptedMessage) => {
	const secret = getSecrets();
	var bytes  = CryptoJS.AES.decrypt(encryptedMessage, secret);
	const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
	if (decryptedMessage == "") {
		return "Unable to decrypt: " + encryptedMessage;
	} else {
		return "SlackPM Secure Message: " + decryptedMessage;
	};
};

const processNewMessages = (messageList) => {
	for (let i=0;i<messageList.length;i++) {
		try {
			const encryptedMessage = messageList[i].firstChild.firstChild.firstChild.lastChild.lastChild.lastChild.firstChild.innerText;
			if (encryptedMessage.slice(0, 5) == encryptionIndicator) {
				const decryptedMessage = decryptText(encryptedMessage.slice(5));
				messageList[i].firstChild.firstChild.firstChild.lastChild.lastChild.lastChild.firstChild.innerHTML = decryptedMessage;
			};
		} catch (error) {
			continue;
		};
	};
};























