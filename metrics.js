async function getARNQueryParams() {
    let queryString = window.location.search;
    let urlParams = new URLSearchParams(queryString);
    let connectARN = urlParams.get("connectARN")
    let contactFlowARN = urlParams.get("contactFlowARN")
    return {
        "connectARN": connectARN,
        "contactFlowARN": contactFlowARN
    }
}

async function initialFetchCloudWatchData() {
    let baseURL = "https://yfa9htwb2c.execute-api.us-east-1.amazonaws.com/testing/metrics";
    let arn = await getARNQueryParams();
    let fullURL = `${baseURL}/?connectARN=${arn["connectARN"]}&contactFlowARN=${arn["contactFlowARN"]}`;
    try {
        // let hash = window.location.hash;
        // let token = hash.split("access_token=")[1].split("&")[0];
        // console.log(token)
        // console.log(hash)
        let token = sessionStorage.getItem("MetricVisionAccessToken");
        let response = await fetch(fullURL, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            return {
                "errorMessage": response,
                "result": false
            }
        } else {
            let cloudWatchData = await response.json();
            // sessionStorage.setItem("MetricVisionData", cloudWatchData)
            return {
                "data": cloudWatchData,
                "result": true
            }
        }
    } catch (err) {
        return {
            "errorMessage": err,
            "result": false
        }
    }

}

async function customTimeFetchCloudWatchData(timeframeLength, timeframeUnit, customStartTime, customEndTime) {
    let baseURL = "https://yfa9htwb2c.execute-api.us-east-1.amazonaws.com/testing/metrics";
    let timeframeLengthParam = '';
    let timeframeUnitParam = '';
    let customStartTimeParam = '';
    let customEndTimeParam = '';
    if (timeframeLength && timeframeUnit) {
        timeframeLengthParam = `/?timeframeLength=${timeframeLength}&`;
        timeframeUnitParam = `timeframeUnit=${timeframeUnit}`;
    }
    if (customStartTime && customEndTime) {
        customStartTimeParam = `/?customStartTime=${customStartTime}&`;
        customEndTimeParam = `customEndTime=${customEndTime}`;
    }

    let arn = await getARNQueryParams();
    let paramURL = `${baseURL}${timeframeLengthParam}${timeframeUnitParam}${customStartTimeParam}${customEndTimeParam}&connectARN=${arn["connectARN"]}&contactFlowARN=${arn["contactFlowARN"]}`;
    // let paramURL = baseURL + timeframeLengthParam + timeframeUnitParam;
    try {
        // let response = await fetch(paramURL);
        // let hash = window.location.hash;
        // let token = hash.split("access_token=")[1].split("&")[0];
        // console.log(token)
        // console.log(hash)
        let token = sessionStorage.getItem("MetricVisionAccessToken");
        let response = await fetch(paramURL, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        if (!response.ok) {
            console.log(response)
            return {
                "errorMessage": response,
                "result": false
            }
        } else {
            let cloudWatchData = await response.json();
            console.log(cloudWatchData)
            // sessionStorage.setItem("MetricVisionData", cloudWatchData)
            return {
                "data": cloudWatchData,
                "result": true
            }
        }
    } catch (err) {
        console.log(err)
        return {
            "errorMessage": err,
            "result": false
        }
    }
}

function cleanMetricName(metricName) {
    let cleanMetricName = metricName.replace(/_/g, ' ').split(' ');
    cleanMetricName = cleanMetricName.map(word => word.charAt(0).toUpperCase() + word.slice(1));
    return cleanMetricName.join(' ');
}

function createTable(data) {
    let metricLabel = cleanMetricName(data.Id)

    let table = document.createElement("table");
    let tableRow = document.createElement("tr");
    table.style.margin = "10px";
    let tableHeader = document.createElement("th");
    tableHeader.innerHTML = "Metric Name";
    table.appendChild(tableRow);
    tableRow.appendChild(tableHeader);
    data.Timestamps.forEach(timestamp => {
        let header = document.createElement("th");
        header.innerHTML = timestamp;
        tableRow.appendChild(header);
    })
    let results = document.querySelector("#results");
    results.appendChild(table)

    let dataRow = document.createElement("tr");
    table.appendChild(dataRow);
    let metricLabelRow = document.createElement("td");
    metricLabelRow.innerHTML = metricLabel;
    dataRow.appendChild(metricLabelRow);
    data.Values.forEach(value => {
        let row = document.createElement("td");
        row.innerHTML = value;
        dataRow.appendChild(row);
    })
}

function newCreateTable(data) {
    let metricLabel = cleanMetricName(data.Id);
    let tableWrapper = document.createElement("div");
    tableWrapper.setAttribute("class", "table-responsive");
    let table = document.createElement("table");
    table.setAttribute("class", "table");
    let tableHead = document.createElement("thead");
    let headerRow = document.createElement("tr");
    tableHead.appendChild(headerRow);
    let tableRowMetricName = document.createElement("th");
    tableRowMetricName.setAttribute("scope", "col");
    tableRowMetricName.setAttribute("style", "text-decoration: underline;");
    tableRowMetricName.innerHTML = "Metric Name";
    headerRow.appendChild(tableRowMetricName);
    data.Timestamps.forEach(timestamp => {
        let header = document.createElement("th");
        header.setAttribute("scope", "col");
        header.innerHTML = timestamp;
        headerRow.appendChild(header);
    })
    table.appendChild(tableHead);
    tableWrapper.appendChild(table);
    let results = document.querySelector("#results");
    results.appendChild(tableWrapper);

    let tableBody = document.createElement("tbody");
    let columnRow = document.createElement("tr");
    tableBody.appendChild(columnRow);
    table.appendChild(tableBody);
    let rowHeader = document.createElement("th");
    rowHeader.setAttribute("scope", "row");
    rowHeader.innerHTML = metricLabel;
    columnRow.appendChild(rowHeader);
    data.Values.forEach(value => {
        let row = document.createElement("td");
        row.innerHTML = value;
        columnRow.appendChild(row);
    })
    table.appendChild(tableBody);

}

async function displayMetricTableData() {
    let loadingModal = document.createElement("p");
    loadingModal.innerHTML = "loading . . .";
    let sectionHeader = document.querySelector(".loading");
    sectionHeader.append(loadingModal);
    let data = await initialFetchCloudWatchData();
    sessionStorage.setItem("MetricVisionData", JSON.stringify(data.data.MetricDataResults))
    console.log(data)
    if (!data.result) {
        sectionHeader.removeChild(loadingModal);
        let error = document.createElement("p");
        error.innerHTML = `Error: ${data.errorMessage.status}`;
        sectionHeader.appendChild(error);
        return
    } else {
        sectionHeader.removeChild(loadingModal);
        let metricDataResults = data.data.MetricDataResults.length;
        for (let i = 0; i < metricDataResults; i++) {
            newCreateTable(data.data.MetricDataResults[i])
        }
    }

}

document.addEventListener("DOMContentLoaded", function () {
    displayMetricTableData();
})
async function submitCustomTimeframe() {
    let timeframeLength = document.querySelector("#timeframeLength").value;
    let timeframeUnit = document.querySelector("#timeframeUnit").value.toLowerCase();
    let loadingModal = document.createElement("p");
    loadingModal.innerHTML = "loading . . .";
    let sectionHeader = document.querySelector(".loading");
    sectionHeader.append(loadingModal);
    let data = await customTimeFetchCloudWatchData(timeframeLength, timeframeUnit, "", "");
    sessionStorage.setItem("MetricVisionData", JSON.stringify(data.data.MetricDataResults))
    if (!data.result) {
        sectionHeader.removeChild(loadingModal);
        let error = document.createElement("p");
        error.innerHTML = `Error: ${data.errorMessage.status}`;
        sectionHeader.appendChild(error);
        return
    } else {
        sectionHeader.removeChild(loadingModal);
        let results = document.querySelector("#results");
        results.remove();
        let newResults = document.querySelector("#sectionResults");
        let section = document.createElement("section");
        section.setAttribute("class", "col");
        section.setAttribute("id", "results");
        newResults.appendChild(section);
        let metricDataResults = data.data.MetricDataResults.length;
        for (let i = 0; i < metricDataResults; i++) {
            newCreateTable(data.data.MetricDataResults[i])
        }
    }

}
async function submitCustomDateTimeframe() {
    let startDate = document.querySelector("#customStartDate").value
    let endDate = document.querySelector("#customEndDate").value
    let loadingModal = document.createElement("p");
    loadingModal.innerHTML = "loading . . .";
    let sectionHeader = document.querySelector(".loading");
    sectionHeader.append(loadingModal);
    let data = await customTimeFetchCloudWatchData("", "", startDate, endDate);
    sessionStorage.setItem("MetricVisionData", JSON.stringify(data.data.MetricDataResults))
    if (!data.result) {
        sectionHeader.removeChild(loadingModal);
        let error = document.createElement("p");
        error.innerHTML = `Error: ${data.errorMessage.status}`;
        sectionHeader.appendChild(error);
        return
    } else {
        sectionHeader.removeChild(loadingModal);
        let results = document.querySelector("#results");
        results.remove();
        let newResults = document.querySelector("#sectionResults");
        let section = document.createElement("section");
        section.setAttribute("class", "col");
        section.setAttribute("id", "results");
        newResults.appendChild(section);
        let metricDataResults = data.data.MetricDataResults.length;
        for (let i = 0; i < metricDataResults; i++) {
            newCreateTable(data.data.MetricDataResults[i])
        }
    }
}

function enableButton() {
    let button = document.querySelector("#customTimeButton")
    let inputValue = document.querySelector("#timeframeLength").value;
    if (inputValue && inputValue >= 1 && inputValue <= 100) {
        button.disabled = false;
        button.classList.remove("btn-secondary")
        button.classList.add("btn-primary")
    } else {
        button.disabled = true;
        button.classList.remove("btn-primary")
        button.classList.add("btn-secondary")
    }
}
function enableCustomTimeframeButton() {
    let customTimeButton = document.querySelector("#customDateTimeButton")
    let startDate = document.querySelector("#customStartDate").value
    let endDate = document.querySelector("#customEndDate").value
    if (startDate && endDate) {
        customTimeButton.disabled = false;
        customTimeButton.classList.remove("btn-secondary")
        customTimeButton.classList.add("btn-primary")
    } else {
        customTimeButton.disabled = true;
        customTimeButton.classList.remove("btn-primary")
        customTimeButton.classList.add("btn-secondary");
    }
}

// let fakeData = { "MetricDataResults": [{ "Id": "calls_per_interval", "Label": "VoiceCalls CallsPerInterval", "Timestamps": ["12/11 10:36 AM", "12/11 2:36 PM"], "Values": [6.0, 2.0] }, { "Id": "missed_calls", "Label": "VoiceCalls MissedCalls", "Timestamps": [], "Values": [] }, { "Id": "calls_breaching_concurrency_quota", "Label": "VoiceCalls CallsBreachingConcurrencyQuota", "Timestamps": [], "Values": [] }, { "Id": "call_recording_upload_error", "Label": "CallRecordings CallRecordingUploadError", "Timestamps": [], "Values": [] }, { "Id": "chats_breaching_active_chat_quota", "Label": "Chats ChatsBreachingActiveChatQuota", "Timestamps": [], "Values": [] }, { "Id": "concurrent_active_chats", "Label": "Chats ConcurrentActiveChats", "Timestamps": [], "Values": [] }, { "Id": "contact_flow_errors", "Label": "1cf9d6bb-1a1e-44a4-b3c7-951cc17cb9de ContactFlow ContactFlowErrors", "Timestamps": [], "Values": [] }, { "Id": "contact_flow_fatal_errors", "Label": "1cf9d6bb-1a1e-44a4-b3c7-951cc17cb9de ContactFlow ContactFlowFatalErrors", "Timestamps": [], "Values": [] }, { "Id": "throttled_calls", "Label": "VoiceCalls ThrottledCalls", "Timestamps": [], "Values": [] }, { "Id": "to_instance_packet_loss_rate", "Label": "Agent Voice WebRTC ToInstancePacketLossRate", "Timestamps": [], "Values": [] }] }
// let completeFakeData = {
//     "data": fakeData,
//     "result": true
// }

// sessionStorage.setItem("fakeMetricVisionData", JSON.stringify(completeFakeData))
