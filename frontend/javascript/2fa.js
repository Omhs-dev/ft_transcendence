import { appSection } from "./utils/domUtils.js";
import { getCookie } from "./login.js";

const baseUrl = "http://localhost:8000";

appSection.addEventListener("click", (e) => {
	const method = document.getElementById('twoFaMethod').value;

	if (e.target.id === 'save' ) {
		console.log("save button have been clicked!");

		if (method === 'totp') {
			console.log("this is auth app method");
			handleAuthApp(method);
		} else if (method === 'email') {
			console.log("this is the email method");
		} else if (method === 'sms') {
			console.log("this is sms mehtod");
		}
	}
});

const handleAuthApp = async (method) => {
	try {
		const response = await fetch(`${baseUrl}/auth/api/select-2fa-method/`, {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({ method }),
		});

		if (!response.ok) {
			throw new Error(`Could ont fetch the api ${response.status}`);
		}

		const data = await response.json();

		const hex = data.qr_code;
		const binary = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
		const base64 = btoa(String.fromCharCode.apply(null, binary));

		const qrCodeImage = document.getElementById('qrCodeImage');
		console.log("qrcodeimage : ", qrCodeImage);
		
		qrCodeImage.src = `data:image/png;base64,${base64}`;
		console.log("data: ", data);
	} catch(error) {

	}
};