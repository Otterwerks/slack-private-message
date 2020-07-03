// Initialization and Listeners
var CryptoJS = require("crypto-js"); //only for running webpack build

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.message === "addSecret") {
			var secret = request.value;
			addSecret(secret);
		};
	}
);

const encryptButton = {
	id: "encryptButton",
	class: "c-button-unstyled c-icon_button c-icon_button--light p-composer__button p-composer__button--sticky",
	style: "margin-left:auto;padding-left:1em;padding-right:1em;width:10em;text-align:center;",
	text: "Encrypt Message"
};

const initializeEncryptionButton = () => {
	const buttonGroup = document.getElementsByClassName("p-composer__body");
	if (buttonGroup.length > 0 && document.getElementById("encryptButton") == null) {
		renderButton(encryptButton, buttonGroup[0], "beforeend", encryptText);
	};
};

const renderButton = (button, parentNode, insertLocation, eventAction) => {
	const buttonSource = '<button id="' + button.id + '" class="' + button.class + '" style="' + button.style + '">' + button.text + '</button>';
	parentNode.insertAdjacentHTML(insertLocation, buttonSource);
	document.getElementById(button.id).addEventListener("click", eventAction);
};

const initializeMessageObserver = () => {
	const messagePane = document.getElementsByClassName("c-virtual_list__scroll_container")[1];
	const messageObserverConfig = {attributes:true, childList:true, subtree:false, characterData:false};
	const messageObserver = new MutationObserver(messageObserverCallback);
	messageObserver.observe(messagePane, messageObserverConfig);
};

const messageObserverCallback = (mutationsList, observer) => {
    for (let mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
			processNewMessages(mutation.addedNodes);
        };
	};
	if (document.getElementById("encryptButton") == null) {

	}
};

const decryptExistingMessages = () => {
	const existingMessages = document.getElementsByClassName("c-virtual_list__item");
	processNewMessages(existingMessages);
}

window.onload = function() {	
	const workspace = document.getElementsByClassName("p-workspace__primary_view_contents")[0];
	const observerConfig = {attributes:false, childList:true, subtree:true, characterData:false};
	const observer = new MutationObserver(observerCallback);
	observer.observe(workspace, observerConfig);
	initialize();
};

const observerCallback = (mutationsList, observer) => {
    for (let mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
			for (let i=0;i<mutation.addedNodes.length;i++) {
				if (mutation.addedNodes[i].className == "ql-composer") {
					initialize();
				};
			};
        };
	};
};

const initialize = () => {
	initializeEncryptionButton();
	initializeMessageObserver();
	decryptExistingMessages();
};

// Secret Management
const getSecrets = () => {
	return window.localStorage.getItem("slackpm_secret");
};

const addSecret = (secret) => {
    window.localStorage.setItem("slackpm_secret", secret);
};

// Encryption & Decryption
const encryptionIndicator = "<<!>>";
const encryptionSuccessNote = "SlackPM Secure Message: ";
const encryptionFailureNote = "Unable to decrypt: ";

const encryptText = () => {
	const secret = getSecrets();
	const textField = document.getElementsByClassName("ql-editor")[0].firstChild;
	const message = textField.innerHTML;
	const messageText = textField.textContent;
	if (messageText.slice(0,5) != encryptionIndicator) {
		if (messageText == "") {
			return;
		};
		var encryptedMessage = CryptoJS.AES.encrypt(message, secret).toString();
		textField.textContent = encryptionIndicator + encryptedMessage;
	} else {
		alert("This message has already been encrypted!");
	};
};

const decryptText = (encryptedMessage) => {
	const secret = getSecrets();
	var bytes  = CryptoJS.AES.decrypt(encryptedMessage, secret);
	const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
	if (decryptedMessage == "") {
		return encryptionFailureNote + encryptedMessage;
	} else {
		return encryptionSuccessNote + decryptedMessage;
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























