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
            sessionStorage.setItem("MetricVisionData", cloudWatchData)
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
            // console.log(cloudWatchData)
            sessionStorage.setItem("MetricVisionData", cloudWatchData)
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

async function displayMetricTableData() {
    let loadingModal = document.createElement("p");
    loadingModal.innerHTML = "loading . . .";
    let sectionHeader = document.querySelector(".loading");
    sectionHeader.append(loadingModal);
    // let data = await initialFetchCloudWatchData();
    let data = JSON.parse(sessionStorage.getItem("fakeMetricVisionData"))
    console.log(data)
    if (!data.result) {
        sectionHeader.removeChild(loadingModal);
        let error = document.createElement("p");
        error.innerHTML = `Error: ${data.errorMessage.status}`;
        sectionHeader.appendChild(error);
        return
    } else {
        // sessionStorage.setItem("MetricVisionData", JSON.stringify(data.data.MetricDataResults))
        sectionHeader.removeChild(loadingModal);
        let metricDataResults = data.data.MetricDataResults.length;
        for (let i = 0; i < metricDataResults; i++) {
            createTableLineGauge(data.data.MetricDataResults[i])
        }
    }
}

function createTableLineGauge(data) {
    //make containers for each, then pass in container to each table, line graph, gauge, and icons
    let rowDiv = document.createElement("div");
    rowDiv.classList.add("row")
    let section = document.createElement("section")
    section.classList.add("col", "d-flex");
    section.setAttribute("id", data.Id)
    let results = document.querySelector("#results");
    rowDiv.appendChild(section)
    results.appendChild(rowDiv)
    createTable(data, section)
    createLineGraphNew(data, section)
    createGauge(data, section)
    createIcons(section)
    
}

function createIcons(container) {
    let tableIcon = document.createElement("i")
    tableIcon.classList.add("tableChart", "fa-solid", "fa-table", "fa-xl", "icon")
    let chartIcon = document.createElement("i")
    chartIcon.classList.add("lineChart", "fa-solid", "fa-chart-line", "fa-xl", "icon")
    let gaugeIcon = document.createElement("i")
    gaugeIcon.classList.add("gaugeChart","fa-solid", "fa-gauge", "fa-xl", "icon")
    chartIcon.addEventListener("click", hideOtherCharts)
    tableIcon.addEventListener("click", hideOtherCharts)
    gaugeIcon.addEventListener("click", hideOtherCharts)
    container.append(tableIcon, chartIcon, gaugeIcon);
}
function hideOtherCharts(e) {
    let target = e.target.classList[0].replace("Chart",'');
    let parentNodeList = e.target.parentElement.childNodes;
    let section = [];
    for (i = 0; i < parentNodeList.length; i++) {
        if (parentNodeList[i].nodeName === "SECTION") {
            section.push(parentNodeList[i])
        }
    }
    for (i = 0; i < section.length; i++) {
        if (section[i].id.includes(target)) {
            section[i].setAttribute("style", "display: block");
        } else {
            section[i].setAttribute("style", "display: none !important;");
        }
    }
}

function createGauge(data, container) {
    // create data set on our data
    // console.log(data)
    let values = data["Values"]
    let min, max, avg, sum;
    if (values.length === 0) {
        min = 0;
        max = 1;
        avg = 0;
        sum = 0;
    } else {
        min = Math.min(...values);
        max = Math.max(...values);
        sum = values.reduce((acc, num) => acc + num, 0);
        avg = parseFloat((sum / values.length).toFixed(2));
    }

    let dataSet = anychart.data.set([avg]);//Where to set avg value!!
    // set the gauge type
    let gauge = anychart.gauges.circular();
    // link the data with the gauge
    gauge.data(dataSet);
    //set the starting angle for the gauge
    gauge.startAngle(270);
    //set the angle limit for the gauge
    gauge.sweepAngle(180);
    let axis = gauge.axis()
    .radius(95)
    .width(1);

    axis.scale()
    .minimum(min)//Where to set Min and Max!!
    .maximum(max);//Where to set Min and Max!!

    axis.ticks()
    .enabled(true)
    .type('line')
    .length('8')

    gauge.range({
        from: min,//Also where to set min!!
        to: max,//Also where to set the max!!
        fill: {keys: ["green", "yellow", "orange" , "red"]},
        position: "inside",
        radius: 100,
        endSize: "3%",
        startSize:"3%",
        zIndex: 10
    });
    gauge.fill("lightblue", .3);

    gauge.needle(0)
    .enabled(true)
    .startRadius('-5%')
    .endRadius('65%')
    .middleRadius(0)
    .startWidth('0.1%')
    .endWidth('0.1%')
    .middleWidth('5%')
    
    // draw the chart
    // gauge.container("gauge_calls_per_interval_container").draw();
    let section = document.createElement("section");
    section.classList.add("flex-grow-1", "d-flex", "justify-content-around", "flex-wrap", "align-items-center");
    section.setAttribute("Id", `gauge_${data.Id}`);

    //metric name column
    let metricNameDiv = document.createElement("div");
    metricNameDiv.classList.add("d-flex", "flex-column", "text-center", "mx3");
    let metricNameTextDiv = document.createElement("b");
    metricNameTextDiv.innerHTML = cleanMetricName(data.Id);
    metricNameDiv.appendChild(metricNameTextDiv);

    //Min and Max columns
    let minMaxDiv = document.createElement("div");
    minMaxDiv.classList.add("d-flex", "flex-column", "text-center", "mx3");
    let minDiv = document.createElement("div");
    let minLabelDiv = document.createElement("div");
    let maxDiv = document.createElement("div");
    let maxLabelDiv = document.createElement("div");
    minDiv.innerHTML = min;
    minLabelDiv.innerHTML = "Minimum";
    maxDiv.innerHTML = max;
    maxLabelDiv.innerHTML = "Maximum";
    minMaxDiv.append(minDiv, minLabelDiv, maxDiv, maxLabelDiv)

    //Avg and Sum Columns
    let avgSumDiv = document.createElement("div");
    avgSumDiv.classList.add("d-flex", "flex-column", "text-center", "mx3");
    let avgDiv = document.createElement("div");
    let avgLabelDiv = document.createElement("div");
    let sumDiv = document.createElement("div");
    let sumLabelDiv = document.createElement("div");
    avgDiv.innerHTML = avg;
    avgLabelDiv.innerHTML = "Average";
    sumDiv.innerHTML = sum;
    sumLabelDiv.innerHTML = "Sum";
    avgSumDiv.append(avgDiv, avgLabelDiv, sumDiv, sumLabelDiv);

    section.append(metricNameDiv, minMaxDiv, avgSumDiv);

    let gaugeDiv = document.createElement("div");
    let containerId = `guage_${data.Id}_container`
    gaugeDiv.setAttribute("id", containerId);
    gauge.container(gaugeDiv).draw();
    section.append(gaugeDiv);
    section.setAttribute("style", "display: none !important")
    container.append(section);
}

function createLineGraphNew(data, container) {
    let metric = data.Id;
    let chartMetricData = [];
    for (let i = 0; i < data["Timestamps"].length; i++) {
        let chartData = [];
        chartData.push(data["Timestamps"][i], data["Values"][i])
        chartMetricData.push(chartData)
    }
    let graphData = {
        // "container": Use metric and just do query selector `#${metric}`
        "title": metric,
        "xAxis": "Interval",
        "yAxis": metric, //But will need to run cleanMetricName
        "data": chartMetricData
    }
    chartLineGraph(graphData, container)
}

function chartLineGraph(graphData, container) {
    let {title, xAxis, yAxis, data} = graphData;
    let chart = anychart.line();
    chart.data(data);
    chart.title(cleanMetricName(title));
    
    // Step 5: Customize axes
    chart.xAxis().title(xAxis);
    // chart.yAxis().title(cleanMetricName(yAxis));

    let flexDiv = document.createElement("section");
    flexDiv.classList.add("flex-grow-1");
    let flexDivId = `lineChart_${title}`;
    flexDiv.setAttribute("id", flexDivId);
    flexDiv.setAttribute("style", "display: none !important");
    

    // Step 6: Display the chart
    chart.container(flexDiv);
    chart.draw();
    container.appendChild(flexDiv);

}

function createTable(data, container) {
    let metricLabel = cleanMetricName(data.Id)
    let tableWrapper = document.createElement("section");
    tableWrapper.setAttribute("class", "table-responsive");
    tableWrapper.setAttribute("id", `table_${data.Id}`)
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
    container.appendChild(tableWrapper);
}

// async function submitCustomTimeframe() {
//     let timeframeLength = document.querySelector("#timeframeLength").value;
//     let timeframeUnit = document.querySelector("#timeframeUnit").value.toLowerCase();
//     let loadingModal = document.createElement("p");
//     loadingModal.innerHTML = "loading . . .";
//     let sectionHeader = document.querySelector(".loading");
//     sectionHeader.append(loadingModal);
//     // let data = await customTimeFetchCloudWatchData(timeframeLength, timeframeUnit, "", "");
//     let data = JSON.parse(sessionStorage.getItem("fakeMetricVisionData"))
//     if (!data.result) {
//         sectionHeader.removeChild(loadingModal);
//         let error = document.createElement("p");
//         error.innerHTML = `Error: ${data.errorMessage.status}`;
//         sectionHeader.appendChild(error);
//         return
//     } else {
//         // sessionStorage.setItem("MetricVisionData", JSON.stringify(data.data.MetricDataResults))
//         sectionHeader.removeChild(loadingModal);
//         let results = document.querySelector("#results");
//         results.remove();
//         let newResults = document.querySelector("#dataTables");
//         let section = document.createElement("div");
//         section.setAttribute("id", "results");
//         newResults.appendChild(section);
//         let metricDataResults = data.data.MetricDataResults.length;
//         for (let i = 0; i < metricDataResults; i++) {
//             createTableLineGauge(data.data.MetricDataResults[i])
//         }
//     }

// }
async function submitCustomDateTimeframe() {
    let startDate = document.querySelector("#customStartDate").value
    let endDate = document.querySelector("#customEndDate").value
    let loadingModal = document.createElement("p");
    loadingModal.innerHTML = "loading . . .";
    let sectionHeader = document.querySelector(".loading");
    sectionHeader.append(loadingModal);
    // let data = await customTimeFetchCloudWatchData("", "", startDate, endDate);
    let data = JSON.parse(sessionStorage.getItem("fakeMetricVisionData"))
    if (!data.result) {
        sectionHeader.removeChild(loadingModal);
        let error = document.createElement("p");
        error.innerHTML = `Error: ${data.errorMessage.status}`;
        sectionHeader.appendChild(error);
        return
    } else {
        // sessionStorage.setItem("MetricVisionData", JSON.stringify(data.data.MetricDataResults));
        sectionHeader.removeChild(loadingModal);
        let results = document.querySelector("#results");
        results.remove();
        let newResults = document.querySelector("#dataTables");
        let section = document.createElement("div");
        section.setAttribute("id", "results");
        newResults.appendChild(section);
        let metricDataResults = data.data.MetricDataResults.length;
        for (let i = 0; i < metricDataResults; i++) {
            createTableLineGauge(data.data.MetricDataResults[i])
        }
    }
}

// function enableButton() {
//     let button = document.querySelector("#customTimeButton")
//     let inputValue = document.querySelector("#timeframeLength").value;
//     if (inputValue && inputValue >= 1 && inputValue <= 100) {
//         button.disabled = false;
//         button.classList.remove("btn-secondary")
//         button.classList.add("btn-primary")
//     } else {
//         button.disabled = true;
//         button.classList.remove("btn-primary")
//         button.classList.add("btn-secondary")
//     }
// }
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

//For testing purposes, use fake data to simulate real data when working in test environment, because not authenticated with Cognito

let fakeData = { "MetricDataResults": [{ "Id": "calls_per_interval", "Label": "VoiceCalls CallsPerInterval", "Timestamps": ["12/11 10:36 AM", "12/11 2:36 PM", "12/12 3:41 PM", "12/16 2:42 PM"], "Values": [6.0, 2.0, 4.0, 1.0] }, { "Id": "missed_calls", "Label": "VoiceCalls MissedCalls", "Timestamps": ["12/10 01:00 AM","12/10 04:00 AM", "12/10 06:32 AM"], "Values": [1.0,2.0,4.0] }, { "Id": "calls_breaching_concurrency_quota", "Label": "VoiceCalls CallsBreachingConcurrencyQuota", "Timestamps": [], "Values": [] }, { "Id": "call_recording_upload_error", "Label": "CallRecordings CallRecordingUploadError", "Timestamps": [], "Values": [] }, { "Id": "chats_breaching_active_chat_quota", "Label": "Chats ChatsBreachingActiveChatQuota", "Timestamps": [], "Values": [] }, { "Id": "concurrent_active_chats", "Label": "Chats ConcurrentActiveChats", "Timestamps": [], "Values": [] }, { "Id": "contact_flow_errors", "Label": "1cf9d6bb-1a1e-44a4-b3c7-951cc17cb9de ContactFlow ContactFlowErrors", "Timestamps": [], "Values": [] }, { "Id": "contact_flow_fatal_errors", "Label": "1cf9d6bb-1a1e-44a4-b3c7-951cc17cb9de ContactFlow ContactFlowFatalErrors", "Timestamps": [], "Values": [] }, { "Id": "throttled_calls", "Label": "VoiceCalls ThrottledCalls", "Timestamps": [], "Values": [] }, { "Id": "to_instance_packet_loss_rate", "Label": "Agent Voice WebRTC ToInstancePacketLossRate", "Timestamps": [], "Values": [] }] }
let completeFakeData = {
    "data": fakeData,
    "result": true
}

sessionStorage.setItem("fakeMetricVisionData", JSON.stringify(completeFakeData))

document.addEventListener("DOMContentLoaded", function () {
    displayMetricTableData();
});



