//newdevinstancehyberscaler AWS Connect instance
let customer1 = {
    "connectARN": "50a49da4-8909-443b-a3c0-33bb97ce165c",
    "contactFlowARN": "5a3c0863-4337-4f3b-ae8c-a81c233aa2f3"
}

//devinstance AWS Connect instance
let customer2 = {
    "connectARN": "15e62379-5da6-4894-a63d-0aa38892ad7c",
    "contactFlowARN": "dc37c1aa-8a22-4b34-b18d-96c31ce0fa60"
}

customer1Button = document.querySelector("#customer1")
customer2Button = document.querySelector("#customer2")
customer1Button.value = JSON.stringify(customer1)
customer2Button.value = JSON.stringify(customer2)
function redirect(arnObject) {
    let connectARN = arnObject.connectARN;
    let contactFlowARN = arnObject.contactFlowARN;
    location.href = `metrics.html?connectARN=${connectARN}&contactFlowARN=${contactFlowARN}`;
}

function parseARNObject(event) {
    let stringObject = event.target.value;
    let parsedObject = JSON.parse(stringObject)
    redirect(parsedObject)
}
customer1Button.addEventListener("click", parseARNObject)
customer2Button.addEventListener("click", parseARNObject)

window.onload = () => {
    let hash = window.location.hash;
    let token = hash.split("access_token=")[1].split("&")[0];
    sessionStorage.setItem("MetricVisionAccessToken", token)
}


