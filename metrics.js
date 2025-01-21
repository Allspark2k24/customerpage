async function getARNQueryParams() {
    let queryString = window.location.search;
    let urlParams = new URLSearchParams(queryString);
    let connectARN = urlParams.get("connectARN")
    let contactFlowARN = urlParams.get("contactFlowARN")
    let contactFlowName = urlParams.get("contactFlowName")
    return {
        "connectARN": connectARN,
        "contactFlowARN": contactFlowARN,
        "contactFlowName": contactFlowName
    }
}

async function customTimeFetchCloudWatchData(customStartTimeandDate, customEndTimeandDate) {
    let baseURL = "https://yfa9htwb2c.execute-api.us-east-1.amazonaws.com/testing/metrics";
    // let baseURL = "https://440wcvfz4j.execute-api.us-east-1.amazonaws.com/testing/metrics";
    let customStartTimeParam = '';
    let customEndTimeParam = '';
    if (customStartTimeandDate && customEndTimeandDate) {
        customStartTimeParam = `&customStartTimeandDate=${customStartTimeandDate}`;
        customEndTimeParam = `&customEndTimeandDate=${customEndTimeandDate}`;
    }

    let arn = await getARNQueryParams();
    let paramURL = `${baseURL}/?connectARN=${arn["connectARN"]}&contactFlowARN=${arn["contactFlowARN"]}&contactFlowName=${arn["contactFlowName"]}${customStartTimeParam}${customEndTimeParam}`;
    try {
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
    // let data = await customTimeFetchCloudWatchData("", "");
    let data = JSON.parse(sessionStorage.getItem("fakeMetricVisionData"))
    console.log(data)
    if (!data.result) {
        sectionHeader.removeChild(loadingModal);
        let error = document.createElement("p");
        error.innerHTML = `Error: ${data.errorMessage.status}`;
        sectionHeader.appendChild(error);
        return
    } else {
        sessionStorage.setItem("MetricVisionData", JSON.stringify(data.data.MetricDataResults))
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
    if (data.Id.includes("percentage")) {
        data.Values.forEach(function (value, index) {
            data.Values[index] = Math.floor(value * 100)
        })
    }
    createLineGraphNew(data, section)
    createTable(data, section)
    createGauge(data, section)
    createIcons(section)

}

function createIcons(container) {
    let tableIcon = document.createElement("i")
    tableIcon.classList.add("tableChart", "fa-solid", "fa-table", "fa-xl", "icon")
    let chartIcon = document.createElement("i")
    chartIcon.classList.add("lineChart", "fa-solid", "fa-chart-line", "fa-xl", "icon")
    let gaugeIcon = document.createElement("i")
    gaugeIcon.classList.add("gaugeChart", "fa-solid", "fa-gauge", "fa-xl", "icon")
    chartIcon.addEventListener("click", hideOtherCharts)
    tableIcon.addEventListener("click", hideOtherCharts)
    gaugeIcon.addEventListener("click", hideOtherCharts)
    container.append(chartIcon, tableIcon, gaugeIcon);
}
function hideOtherCharts(event) {
    let target = event.target.classList[0].replace("Chart", '');
    let parentNodeList = event.target.parentElement.childNodes;
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
    let values = data["Values"]
    let min, max, avg, sum;
    if (data.Id.includes("percentage")) {
        min = 0;
        max = 100;
        sum = "N/A"
        if (values.length === 0) {
            avg = 0;
        } else if (values.every(value => value === values[0])) {
            avg = parseFloat(((values.reduce((acc, num) => acc + num, 0)) / values.length).toFixed(2));
        } else {
            avg = parseFloat(((values.reduce((acc, num) => acc + num, 0)) / values.length).toFixed(2));
        }
    } else if (data.Id.includes("packet_loss")){
        min = 0;
        max = 100;
        sum = "N/A";
        if (values.length === 0) {
            avg = 0;
        } else if (values.every(value => value === values[0])) {
            avg = parseFloat(((values.reduce((acc, num) => acc + num, 0)) / values.length).toFixed(2));
        } else {
            avg = parseFloat(((values.reduce((acc, num) => acc + num, 0)) / values.length).toFixed(2));
        }
    } else {
        if (values.length === 0) {
            min = 0;
            max = 1;
            sum = 0;
            avg = 0;
        } else if (values.every(value => value === values[0])) {
            min = Math.min(0, values[0]);
            max = values[0] + 1;
            sum = values.reduce((acc, num) => acc + num, 0);
            avg = values[0];
        } else {
            min = Math.min(...values);
            max = Math.max(...values);
            sum = values.reduce((acc, num) => acc + num, 0);
            avg = parseFloat((sum / values.length).toFixed(2));
        }
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
        fill: { keys: ["green", "yellow", "orange", "red"] },
        position: "inside",
        radius: 100,
        endSize: "3%",
        startSize: "3%",
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
        if (metric === "to_instance_packet_loss_rate") {
            chartData.push(data["Timestamps"][i], data["Values"][i].toFixed(3))
            chartMetricData.push(chartData)
            continue
        } else {
            chartData.push(data["Timestamps"][i], data["Values"][i])
            chartMetricData.push(chartData)
        } 
    }
    let graphData = {
        "title": metric,
        "xAxis": "Interval",
        "yAxis": metric,
        "data": chartMetricData
    }
    chartLineGraph(graphData, container)
}

function chartLineGraph(graphData, container) {
    let { title, xAxis, yAxis, data } = graphData;
    let chart = anychart.line();
    chart.data(data);
    chart.title(cleanMetricName(title));

    // Step 5: Customize axes
    chart.xAxis().title(xAxis);

    let flexDiv = document.createElement("section");
    flexDiv.classList.add("flex-grow-1");
    let flexDivId = `lineChart_${title}`;
    flexDiv.setAttribute("id", flexDivId);


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
    if (data.Id.includes("percentage")) {
        data.Values.forEach(value => {
            let row = document.createElement("td");
            row.innerHTML = value + '%';
            columnRow.appendChild(row);
        })
    } else if (data.Id.includes("packet_loss")){
        data.Values.forEach(value => {
            let row = document.createElement("td");
            row.innerHTML = value.toFixed(3) + '%';
            columnRow.appendChild(row);
        })
    } else {
        data.Values.forEach(value => {
            let row = document.createElement("td");
            row.innerHTML = value;
            columnRow.appendChild(row);
        })
    }

    table.appendChild(tableBody);
    tableWrapper.setAttribute("style", "display: none !important");
    container.appendChild(tableWrapper);
}

async function submitCustomDateTimeframe() {
    let startDate = document.querySelector("#customStartDate").value
    let endDate = document.querySelector("#customEndDate").value
    let startTime = document.querySelector("#startTime").value
    let endTime = document.querySelector("#endTime").value
    let timezoneChoice = document.querySelector("#timezoneButton").innerHTML
    let localTimezoneChoice = timezoneChoice.split(" ")[0];
    let formatterOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }
    let timezoneFormats = {
        "Hawaii": "Pacific/Honolulu",
        "Alaska": "America/Anchorage",
        "Pacific": "America/Los_Angeles", 
        "Mountain": "America/Denver",
        "Central": "America/Chicago",
        "Eastern": "America/New_York",
        "UTC": "UTC"
    }
    if (localTimezoneChoice != "Local") {
        formatterOptions.timeZone = timezoneFormats[localTimezoneChoice];
    }

    let startUTC = localDateToUTC(startDate, startTime);
    let endUTC = localDateToUTC(endDate, endTime);
    let loadingModal = document.createElement("p");
    loadingModal.innerHTML = "loading . . .";
    let sectionHeader = document.querySelector(".loading");
    sectionHeader.append(loadingModal);
    // let data = await customTimeFetchCloudWatchData(startUTC, endUTC);
    let data = JSON.parse(sessionStorage.getItem("fakeMetricVisionData"))
    if (!data.result) {
        sectionHeader.removeChild(loadingModal);
        let error = document.createElement("p");
        error.innerHTML = `Error: ${data.errorMessage.status}`;
        sectionHeader.appendChild(error);
        return
    } else {
        for (let i = 0; i < data.data.MetricDataResults.length; i++) {
            if (data.data.MetricDataResults[i]['Timestamps'].length > 0) {
                let timestampsArray = data.data.MetricDataResults[i]['Timestamps']
                for (let j = 0; j < timestampsArray.length; j++) {
                    let formatter = new Intl.DateTimeFormat("en-US", formatterOptions)
                    let UTCDate = timestampsArray[j] + " UTC";
                    let UTCDateObject = new Date(UTCDate);
                    let formattedDate = formatter.format(UTCDateObject);
                    timestampsArray[j] = formattedDate;
                }
            }
        }
        sessionStorage.setItem("MetricVisionData", JSON.stringify(data.data.MetricDataResults));
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

function enableCustomTimeframeButton() {
    let customTimeButton = document.querySelector("#customDateTimeButton")
    let startDate = document.querySelector("#customStartDate").value
    let endDate = document.querySelector("#customEndDate").value
    let startTime = document.querySelector("#startTime").value
    let endTime = document.querySelector("#endTime").value
    if (startDate && endDate && startTime && endTime) {
        customTimeButton.disabled = false;
        customTimeButton.classList.remove("btn-secondary")
        customTimeButton.classList.add("btn-primary")
    } else {
        customTimeButton.disabled = true;
        customTimeButton.classList.remove("btn-primary")
        customTimeButton.classList.add("btn-secondary");
    }
}

function displayTimeandDates() {
    let startTime = document.querySelector("#startTime");
    let endTime = document.querySelector("#endTime");
    let startDate = document.querySelector("#customStartDate");
    let endDate = document.querySelector("#customEndDate");
    let { currentDate, currentTime, twoWeeksAgoDate, twoWeeksAgoTime } = getFormattedDates();
    startTime.value = twoWeeksAgoTime;
    startDate.value = twoWeeksAgoDate;
    endTime.value = currentTime;
    endDate.value = currentDate;
}
function getFormattedDates() {
    // Get the current date
    const currentDate = new Date();

    // Helper function to format date to YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        let month = date.getMonth() + 1; // Months are 0-based
        let day = date.getDate();

        // Pad month and day with leading zeros if necessary
        month = month < 10 ? '0' + month : month;
        day = day < 10 ? '0' + day : day;

        return `${year}-${month}-${day}`;
    }

    // Helper function to format time to HH:MM
    function formatTime(date) {
        let hours = date.getHours();
        let minutes = date.getMinutes();

        // Pad hours and minutes with leading zeros if necessary
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;

        return `${hours}:${minutes}`;
    }

    // Get the current formatted date and time
    const currentFormattedDate = formatDate(currentDate);
    const currentFormattedTime = formatTime(currentDate);

    // Get the date 2 weeks ago
    const twoWeeksAgoDate = new Date(currentDate);
    twoWeeksAgoDate.setDate(currentDate.getDate() - 14);

    // Get the formatted date and time for 2 weeks ago
    const twoWeeksAgoFormattedDate = formatDate(twoWeeksAgoDate);
    const twoWeeksAgoFormattedTime = formatTime(twoWeeksAgoDate);

    return {
        currentDate: currentFormattedDate,
        currentTime: currentFormattedTime,
        twoWeeksAgoDate: twoWeeksAgoFormattedDate,
        twoWeeksAgoTime: twoWeeksAgoFormattedTime
    };
}

function timezoneDropdownChoice(event) {
    let timezoneDropdownButtonText = document.querySelector("#timezoneButton")
    timezoneDropdownButtonText.innerHTML = event.target.innerHTML
}

function refreshDropdownChoice(event) {
    let refreshDropdownButton = document.querySelector("#autoRefreshButton");
    refreshDropdownButton.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-lg"></i> ${event.target.innerHTML}`;
}

function localDateToUTC(rawDateInput, rawTimeInput) {
    let [year, month, day] = rawDateInput.split("-");
    month = parseInt(month) - 1;
    let [hours, minutes] = rawTimeInput.split(":");
    let UTCDate = new Date(year, month, day, hours, minutes).toISOString()
    return UTCDate;
}


document.addEventListener("DOMContentLoaded", function () {
    displayMetricTableData();
    displayTimeandDates();
});

//For testing purposes, use fake data to simulate real data when working in test environment, because not authenticated with Cognito

let fakeData = {
    "MetricDataResults": [
      {
        "Id": "calls_per_interval",
        "Label": "VoiceCalls CallsPerInterval",
        "Timestamps": [
          "12/11/2024 10:36 AM",
          "12/11/2024 2:36 PM",
          "12/12/2024 3:41 PM",
          "12/16/2024 2:42 PM"
        ],
        "Values": [
          6,
          2,
          4,
          1
        ]
      },
      {
        "Id": "missed_calls",
        "Label": "VoiceCalls MissedCalls",
        "Timestamps": [
          "12/10/2024 01:00 AM",
          "12/10/2024 04:00 AM",
          "12/10/2024 06:32 AM"
        ],
        "Values": [
          1,
          2,
          4
        ]
      },
      {
        "Id": "calls_breaching_concurrency_quota",
        "Label": "VoiceCalls CallsBreachingConcurrencyQuota",
        "Timestamps": [
          "12/11/2024 10:36 AM",
          "12/11/2024 10:46 AM",
          "12/11/2024 10:56 AM"
        ],
        "Values": [
          1,
          1,
          1
        ]
      },
      {
        "Id": "concurrent_calls_percentage",
        "Label": "VoiceCalls ConcurrentCallsPercentage",
        "Timestamps": [
          "01/09/2025 7:15 AM",
          "01/09/2025 7:20 AM",
          "01/09/2025 7:30 AM",
          "01/09/2025 7:35 AM",
          "01/09/2025 7:40 AM",
          "01/09/2025 7:45 AM",
          "01/09/2025 7:50 AM",
          "01/09/2025 7:55 AM",
          "01/10/2025 10:00 AM",
          "01/10/2025 10:05 AM",
          "01/10/2025 10:10 AM",
          "01/13/2025 10:50 AM",
          "01/13/2025 10:55 AM",
          "01/13/2025 11:05 AM",
          "01/13/2025 11:10 AM",
          "01/13/2025 11:15 AM",
          "01/13/2025 11:30 AM"
        ],
        "Values": [
          0.1,
          0.1,
          0.1469512195121951,
          0.1,
          0.13077339102217417,
          0.12989323843416373,
          0.10000000000000002,
          0.10000000000000002,
          0.09999999999999998,
          0.09999999999999999,
          0.09999999999999998,
          0.1793103448275862,
          0.14564973861090366,
          0.10000000000000002,
          0.1,
          0.09999999999999999,
          0.1
        ]
      },
      {
        "Id": "call_recording_upload_error",
        "Label": "CallRecordings CallRecordingUploadError",
        "Timestamps": [],
        "Values": []
      },
      {
        "Id": "chats_breaching_active_chat_quota",
        "Label": "Chats ChatsBreachingActiveChatQuota",
        "Timestamps": [],
        "Values": []
      },
      {
        "Id": "concurrent_active_chats",
        "Label": "Chats ConcurrentActiveChats",
        "Timestamps": [],
        "Values": []
      },
      {
        "Id": "contact_flow_errors",
        "Label": "1cf9d6bb-1a1e-44a4-b3c7-951cc17cb9de ContactFlow ContactFlowErrors",
        "Timestamps": [],
        "Values": []
      },
      {
        "Id": "contact_flow_fatal_errors",
        "Label": "1cf9d6bb-1a1e-44a4-b3c7-951cc17cb9de ContactFlow ContactFlowFatalErrors",
        "Timestamps": [],
        "Values": []
      },
      {
        "Id": "throttled_calls",
        "Label": "VoiceCalls ThrottledCalls",
        "Timestamps": [],
        "Values": []
      },
      {
        "Id": "to_instance_packet_loss_rate",
        "Label": "Agent Voice WebRTC ToInstancePacketLossRate",
        "Timestamps": [
            "01/09/2025 7:15 AM",
            "01/09/2025 7:20 AM",
            "01/09/2025 7:30 AM",
            "01/09/2025 7:35 AM",
            "01/09/2025 7:40 AM",
            "01/09/2025 7:45 AM",
            "01/09/2025 7:50 AM",
            "01/10/2025 10:10 AM",
            "01/13/2025 10:55 AM",
            "01/13/2025 11:05 AM",
            "01/13/2025 11:10 AM",
            "01/13/2025 11:15 AM",
            "01/13/2025 11:30 AM"
          ],
        "Values": [
            0.001002004008016032,
            0.002004008016032064,
            0.004008016032064128,
            0,
            0.0028024112096448383,
            0.002004008016032064,
            0.0050200803212851405,
            0.005681792478862917,
            0.0007301935012778385,
            0.01002004008016032,
            0.000502008032128514,
            0.18457083194600304,
            0.004011034116425622
          ]
      }
    ]
  }
let completeFakeData = {
    "data": fakeData,
    "result": true
}

sessionStorage.setItem("fakeMetricVisionData", JSON.stringify(completeFakeData))





