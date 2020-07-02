window.onload=function(){
	document.getElementById("addsecret").addEventListener("click", testFunction);
};

function testFunction () {
	let secret = document.getElementById("newSecret").value;
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	var activeTab = tabs[0];
	chrome.tabs.sendMessage(activeTab.id, {"message": "addSecret", "value": secret});
	});
}