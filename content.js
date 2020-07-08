var CryptoJS = require("crypto-js");
var bigInt = require("big-integer");

// Initialization and Listeners
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.message === "addSecret") {
			var secret = request.value;
			addSecret(secret);
		} else if (request.message === "requestSecretList") {
			const secretList = getSecrets();
			sendResponse({"secretList": secretList});
		};
	}
);

const encryptButton = {
	id: "encryptButton",
	class: "c-button-unstyled c-icon_button c-icon_button--light p-composer__button p-composer__button--sticky",
	style: "margin-left:auto;padding-left:1em;padding-right:1em;width:10em;text-align:center;",
	text: "Encrypt Message"
};

const diffieHellmanButton = `
	<div id="dhbutton" class="btn-group dropup">
  		<button type="button" class="c-button-unstyled c-icon_button c-icon_button--light p-composer__button p-composer__button--sticky dropdown-toggle" data-toggle="dropdown">
    		Secure Key Exchange
  		</button>
		<div class="dropdown-menu">
			<button class="c-button-unstyled c-icon_button c-icon_button--light p-composer__button p-composer__button--sticky dropdown-item" href="#">Action</button>
			<button class="c-button-unstyled c-icon_button c-icon_button--light p-composer__button p-composer__button--sticky dropdown-item" href="#">Another action</button>
			<button class="c-button-unstyled c-icon_button c-icon_button--light p-composer__button p-composer__button--sticky dropdown-item" href="#">Something else here</button>
			<div class="dropdown-divider"></div>
			<button class="c-button-unstyled c-icon_button c-icon_button--light p-composer__button p-composer__button--sticky dropdown-item" href="#">Separated link</button>
  		</div>
	</div>
`;

const initializeEncryptionButton = () => {
	const buttonGroup = document.getElementsByClassName("p-composer__body");
	if (buttonGroup.length > 0 && document.getElementById("encryptButton") == null) {
		renderButton(encryptButton, buttonGroup[0], "beforeend", encryptText);
	};
};

const initializeDiffieHellmanButton = () => {
	const buttonGroup = document.getElementsByClassName("p-composer__body");
	if (buttonGroup.length > 0 && document.getElementById("dhButton") == null) {
		buttonGroup[0].insertAdjacentHTML("beforeend", diffieHellmanButton);
		//document.getElementById("dhbutton").addEventListener("click", initiateDiffieHellman);
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
	if (getSecrets() == null) {
		alert("Please set a secret by clicking the SlackPM extension icon in the toolbar.");
	}
};

const observerCallback = (mutationsList, observer) => {
    for (let mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				if (mutation.addedNodes[i].className == "ql-composer") {
					initialize();
				};
			};
        };
	};
};

const initialize = () => {
	initializeEncryptionButton();
	initializeDiffieHellmanButton();
	initializeMessageObserver();
	decryptExistingMessages();
};

// Secret Management
const getSecrets = () => {
	return JSON.parse(window.localStorage.getItem("slackpm_secrets"));
};

const addSecret = (secret) => {
	window.localStorage.setItem("slackpm_secrets", JSON.stringify([secret]));
	decryptExistingMessages();
};

// Helpers
const readFromEditor = (type) => {
	const editorField = document.getElementsByClassName("ql-editor")[0].firstChild;
	if (type == "text") {
		return editorField.textContent
	} else if (type == "html") {
		return editorField.innerHTML
	};
};

const writeToEditor = (input) => {
	const editorField = document.getElementsByClassName("ql-editor")[0].firstChild;
	editorField.textContent = input;
};

// Encryption & Decryption
const encryptionIndicator = "<<!>>";
const encryptionSuccessNote = "SlackPM Secure Message: ";
const encryptionFailureNote = "Unable to decrypt: ";

const indicatorPresent = (string) => {
	if (string.slice(0, 5) == encryptionIndicator) {
		return true;
	} else {
		return false;
	};
};

const encryptText = () => {
	const secret = getSecrets()[0].value;
	const message = readFromEditor('html')
	const messageText = readFromEditor('text');
	if (!indicatorPresent(messageText)) {
		if (messageText == "") {
			return;
		};
		var encryptedMessage = CryptoJS.AES.encrypt(message, secret).toString();
		writeToEditor(encryptionIndicator + encryptedMessage);
	} else {
		alert("This message has already been encrypted!");
	};
};

const decryptText = (encryptedMessage) => {
	const secret = getSecrets()[0].value;
	var bytes  = CryptoJS.AES.decrypt(encryptedMessage, secret);
	const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
	if (decryptedMessage == "") {
		return encryptionFailureNote + encryptedMessage;
	} else {
		return encryptionSuccessNote + decryptedMessage;
	};
};

const processNewMessages = (messageList) => {
	for (let i = 0; i < messageList.length; i++) {
		try {
			const textElement = findTextElement(messageList[i]);
			const encryptedMessage = textElement.textContent;
			if (indicatorPresent(encryptedMessage)) {
				const decryptedMessage = decryptText(encryptedMessage.slice(5));
				textElement.innerHTML = decryptedMessage;
			};
		} catch (error) {
			continue;
		};
	};
};

const findTextElement = (node) => {
    if (indicatorPresent(node.textContent)) {
        return node;
    };
    for (let i = node.childNodes.length; i > 0; i--) {
        let nextNode = findTextElement(node.childNodes[i-1]);
        if (nextNode != null) {
            return nextNode;
        };
	};
    return null;
}

//Diffie Hellman (Group 18)
var diffieHellmanG = bigInt(2);
var diffieHellmanP = bigInt("FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C93402849236C3FAB4D27C7026C1D4DCB2602646DEC9751E763DBA37BDF8FF9406AD9E530EE5DB382F413001AEB06A53ED9027D831179727B0865A8918DA3EDBEBCF9B14ED44CE6CBACED4BB1BDB7F1447E6CC254B332051512BD7AF426FB8F401378CD2BF5983CA01C64B92ECF032EA15D1721D03F482D7CE6E74FEF6D55E702F46980C82B5A84031900B1C9E59E7C97FBEC7E8F323A97A7E36CC88BE0F1D45B7FF585AC54BD407B22B4154AACC8F6D7EBF48E1D814CC5ED20F8037E0A79715EEF29BE32806A1D58BB7C5DA76F550AA3D8A1FBFF0EB19CCB1A313D55CDA56C9EC2EF29632387FE8D76E3C0468043E8F663F4860EE12BF2D5B0B7474D6E694F91E6DBE115974A3926F12FEE5E438777CB6A932DF8CD8BEC4D073B931BA3BC832B68D9DD300741FA7BF8AFC47ED2576F6936BA424663AAB639C5AE4F5683423B4742BF1C978238F16CBE39D652DE3FDB8BEFC848AD922222E04A4037C0713EB57A81A23F0C73473FC646CEA306B4BCBC8862F8385DDFA9D4B7FA2C087E879683303ED5BDD3A062B3CF5B3A278A66D2A13F83F44F82DDF310EE074AB6A364597E899A0255DC164F31CC50846851DF9AB48195DED7EA1B1D510BD7EE74D73FAF36BC31ECFA268359046F4EB879F924009438B481C6CD7889A002ED5EE382BC9190DA6FC026E479558E4475677E9AA9E3050E2765694DFC81F56E880B96E7160C980DD98EDD3DFFFFFFFFFFFFFFFFF", 16);
var diffieHellmanSecretKey = null;
var diffieHellmanFriendComputation = null;
var diffieHellmanPending = false;

const generateA = () => {
	const hex = "0123456789ABCDEF";
	var secretKey = "";
	for (let i = 0; i < 512; i++) {
		secretKey = secretKey + hex[Math.floor(Math.random()*16)];
	};
	return bigInt(secretKey, 16);
};

const initiateDiffieHellman = () => {
	diffieHellmanPending = true;
	diffieHellmanSecretKey = generateA();
	var computation = diffieHellmanG.modPow(diffieHellmanSecretKey, diffieHellmanP);
	writeToEditor(computation);
	console.log(computation);
};

const completeDiffieHellman = () => {
	
	cleanupDiffieHellman();
};

const cleanupDiffieHellman = () => {
	diffieHellmanP = false;
	diffieHellmanSecretKey = null;
	diffieHellmanFriendComputation = null;
};

























