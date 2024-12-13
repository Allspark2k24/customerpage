import json #For handling json data
import boto3 #For using the aws boto3 sdk
import os #For potential environment variables
from datetime import datetime, timedelta, timezone #For time manipulation
from zoneinfo import ZoneInfo #For handling time change from UTC (times from cloudwatch) to US Central time in this case

def lambda_handler(event, context):
    client = boto3.client('cloudwatch') #Create a cloudwatch client to use the get metric data method
    
    
    awsARN = event['connectARN'] #ARN of the AWS Connect instance passed in via parameter
    contactFlowARN = event['contactFlowARN'] #ARN of AWS Connect specific contact flow passed in via parameter
    
    if "timeframeLength" in event: #If parameter passed in, use this, if not, initialize to empty string. For certain start time to present
        timeframeLength = event['timeframeLength']
    else:
        timeframeLength = "";
    if "timeframeUnit" in event: #If parameter passed in, use this, if not, initialize to empty string. For certain start time to present
        timeframeUnit = event['timeframeUnit']
    else:
        timeframeUnit = "";
    if "customStartTime" in event: #If parameter passed in, use this, if not, initialize to empty string. For certain start and end time
        customStartTime = event['customStartTime']
    else:
        customStartTime = "";
    if "customEndTime" in event: #If parameter passed in, use this, if not, initialize to empty string. For certain start and end time
        customEndTime = event['customEndTime']
    else:
        customEndTime = "";
    

    # Define the time range
    end_time = datetime.now() #End time defaults to present
    if timeframeLength and timeframeUnit: #If want to use preset start time and current end time, use this block
        dateArgs = {timeframeUnit: int(timeframeLength)}
        start_time = end_time - timedelta(**dateArgs)
    else:
        start_time = end_time - timedelta(weeks=2) #Default is metrics for last 2 weeks
    if customStartTime and customEndTime: #If want to use custom start and end times, use this block
        start_time = datetime.strptime(customStartTime, "%Y-%m-%d")
        end_time = datetime.strptime(customEndTime, "%Y-%m-%d")
    

    # Define the parameters for the get_metric_data call
    params = {
        'StartTime': start_time, #Start time for metric data
        'EndTime': end_time, #End time for metric data
        'MetricDataQueries': [ #List of metric data queries to perform
            {
                'Id': 'calls_per_interval',  #Metric query for calls per interval
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Connect',
                        'MetricName': 'CallsPerInterval',
                        'Dimensions': [
                            {
                                'Name': 'InstanceId',
                                'Value': awsARN  # AWS Connect Instance ID
                            },
                            {
                                "Name": "MetricGroup",
                                "Value": "VoiceCalls"
                            },
                            
                        ]
                    },
                    'Period': 300,  # Period in seconds (5 minutes)
                    'Stat': 'Sum',  # Statistic to retrieve
                    'Unit': 'Count'  # Unit of the metric
                },
                'ReturnData': True
            },
            {
                'Id': 'missed_calls',  #Metric query for number of missed calls
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Connect',
                        'MetricName': 'MissedCalls',
                        'Dimensions': [
                            {
                                'Name': 'InstanceId',
                                'Value': awsARN  # AWS Connect Instance ID
                            },
                            {
                                "Name": "MetricGroup",
                                "Value": "VoiceCalls"
                            },
                            
                        ]
                    },
                    'Period': 300,  # Period in seconds (5 minutes)
                    'Stat': 'Sum',  # Statistic to retrieve
                    'Unit': 'Count'  # Unit of the metric
                },
                'ReturnData': True
            },
            {
                'Id': 'calls_breaching_concurrency_quota',  #Metric query for calls breaching concurrency quota
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Connect',
                        'MetricName': 'CallsBreachingConcurrencyQuota',
                        'Dimensions': [
                            {
                                'Name': 'InstanceId',
                                'Value': awsARN  # AWS Connect Instance ID
                            },
                            {
                                "Name": "MetricGroup",
                                "Value": "VoiceCalls"
                            },
                            
                        ]
                    },
                    'Period': 300,  # Period in seconds (5 minutes)
                    'Stat': 'Sum',  # Statistic to retrieve
                    'Unit': 'Count'  # Unit of the metric
                },
                'ReturnData': True
            },
            {
                'Id': 'call_recording_upload_error',  #Metric query for call recording upload error
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Connect',
                        'MetricName': 'CallRecordingUploadError',
                        'Dimensions': [
                            {
                                'Name': 'InstanceId',
                                'Value': awsARN  # AWS Connect Instance ID
                            },
                            {
                                "Name": "MetricGroup",
                                "Value": "CallRecordings"
                            },
                            
                        ]
                    },
                    'Period': 300,  # Period in seconds (5 minutes)
                    'Stat': 'Sum',  # Statistic to retrieve
                    'Unit': 'Count'  # Unit of the metric
                },
                'ReturnData': True
            },
            {
                'Id': 'chats_breaching_active_chat_quota',  #Metric query for chats breaching active chat quota
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Connect',
                        'MetricName': 'ChatsBreachingActiveChatQuota',
                        'Dimensions': [
                            {
                                'Name': 'InstanceId',
                                'Value': awsARN  # AWS Connect Instance ID
                            },
                            {
                                "Name": "MetricGroup",
                                "Value": "Chats"
                            },
                            
                        ]
                    },
                    'Period': 300,  # Period in seconds (5 minutes)
                    'Stat': 'Sum',  # Statistic to retrieve
                    'Unit': 'Count'  # Unit of the metric
                },
                'ReturnData': True
            },
            {
                'Id': 'concurrent_active_chats',  #Metric query for concurrent active chats
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Connect',
                        'MetricName': 'ConcurrentActiveChats',
                        'Dimensions': [
                            {
                                'Name': 'InstanceId',
                                'Value': awsARN  # AWS Connect Instance ID
                            },
                            {
                                "Name": "MetricGroup",
                                "Value": "Chats"
                            },
                            
                        ]
                    },
                    'Period': 300,  # Period in seconds (5 minutes)
                    'Stat': 'Sum',  # Statistic to retrieve
                    'Unit': 'Count'  # Unit of the metric
                },
                'ReturnData': True
            },
            {
                'Id': 'contact_flow_errors',  #Metric query for contact flow errors 
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Connect',
                        'MetricName': 'ContactFlowErrors',
                        'Dimensions': [
                            {
                                'Name': 'InstanceId',
                                'Value': awsARN  # AWS Connect Instance ID for devinstance
                            },
                            {
                                "Name": "MetricGroup",
                                "Value": "ContactFlow"
                            },
                            {
                              "Name": "ContactFlowName",
                              "Value": contactFlowARN
                            }
                            
                        ]
                    },
                    'Period': 300,  # Period in seconds (5 minutes)
                    'Stat': 'Sum',  # Statistic to retrieve
                    'Unit': 'Count'  # Unit of the metric
                },
                'ReturnData': True
            },
            {
                'Id': 'contact_flow_fatal_errors',  #Metric query for fatal contact flow errors
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Connect',
                        'MetricName': 'ContactFlowFatalErrors',
                        'Dimensions': [
                            {
                                'Name': 'InstanceId',
                                'Value': awsARN  # AWS Connect Instance ID for devinstance
                            },
                            {
                                "Name": "MetricGroup",
                                "Value": "ContactFlow"
                            },
                            {
                              "Name": "ContactFlowName",
                              "Value": contactFlowARN
                            }
                            
                        ]
                    },
                    'Period': 300,  # Period in seconds (5 minutes)
                    'Stat': 'Sum',  # Statistic to retrieve
                    'Unit': 'Count'  # Unit of the metric
                },
                'ReturnData': True
            },
            {
                'Id': 'throttled_calls',  #Metric query for throttled calls
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Connect',
                        'MetricName': 'ThrottledCalls',
                        'Dimensions': [
                            {
                                'Name': 'InstanceId',
                                'Value': awsARN  # AWS Connect Instance ID
                            },
                            {
                                "Name": "MetricGroup",
                                "Value": "VoiceCalls"
                            },
                            
                        ]
                    },
                    'Period': 300,  # Period in seconds (5 minutes)
                    'Stat': 'Sum',  # Statistic to retrieve
                    'Unit': 'Count'  # Unit of the metric
                },
                'ReturnData': True
            },
            {
                'Id': 'to_instance_packet_loss_rate',  # Metric query for packet loss rate
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Connect',
                        'MetricName': 'ToInstancePacketLossRate',
                        'Dimensions': [
                            {
                                'Name': 'InstanceId',
                                'Value': awsARN  # AWS Connect Instance ID
                            },
                            {
                                "Name": "Participant",
                                "Value": "Agent"
                            },
                            {
                                "Name": "Type of Connection",
                                "Value": "WebRTC"
                            },
                            {
                                "Name": "Stream Type",
                                "Value": "Voice"
                            },
                        ]
                    },
                    'Period': 300,  # Period in seconds (5 minutes)
                    'Stat': 'Sum',  # Statistic to retrieve
                    'Unit': 'Count'  # Unit of the metric
                },
                'ReturnData': True
            }
        ]
    }
    
    # List metrics in use on Cloudwatch for Amazon Connect
    # metricsListResponse = client.list_metrics(Namespace="AWS/Connect")
    # return metricsListResponse

    metricDataResponse = client.get_metric_data(**params) #Fetch data for the defined queries

    allDataResponse = [] #Initialize an array to hold data from fetch request
    allDataResponse.append(metricDataResponse) #Add data to array to loop through below

    #Handle pagination if necessary (in case there is more data to retrieve)
    while "NextToken" in metricDataResponse: #Check if there is more data to fetch (pagination)
        params["NextToken"] = metricDataResponse["NextToken"] #Add NextToken to the parameters for the next API call
        newMetricDataResponse = client.get_metric_data(**params) #Fetch the next set of data
        allDataResponse.append(newMetricDataResponse) #Append the new data response to the list
        metricDataResponse = newMetricDataResponse #Update the main response variable

    
    #Format timestamps into a more readable format (e.g. "MM/DD HH:MM Am/Pm")
    for element in allDataResponse: #Iterate through each data response
        for metric in element['MetricDataResults']: #Iterate through each metric result
            metric['Timestamps'] = [value.replace(tzinfo=ZoneInfo("UTC")).astimezone(ZoneInfo("US/Central")).strftime("%m/%d %-I:%M %p") for value in metric['Timestamps']] #Format time stamp by converting from UTC to US Central, then formatting in readable MM/DD HH:MM AM/PM
          
    #Merge data from all responses into a single dictionary for each metric

    mergedData = {} #Initialize an empty dictionary to store the merged data
          
    for element in allDataResponse: #Iterate over all data responses
        if element["ResponseMetadata"]["HTTPStatusCode"] == 200: #Check if the response was successful
            for result in element["MetricDataResults"]: #Iterate over the metric data results
                metric_id = result["Id"] #Get the id of the current metric
                if metric_id not in mergedData: #If this metric is not already in mergedData
                    mergedData[metric_id] = { #Initialize the entry for this metric
                        "Id": metric_id,
                        "Label": result["Label"], #Store the label for the metric
                        "Timestamps": [], #Initialize empty list for metric timestamps
                        "Values": [], #Initialize empty list for metric values
                    }
                #Append the current metric's timestamps and values to the merged data
                mergedData[metric_id]["Timestamps"].extend(result["Timestamps"])
                mergedData[metric_id]["Values"].extend(result["Values"])
              
    allMergedData = list(mergedData.values()) #Get all merged metric data as a list

    #Loop through for every metric its timestamps and values and reverse them, because cloudwatch by default gives values in reverse chronological order
    for metric in allMergedData:
        metric['Timestamps'] = metric["Timestamps"][::-1]
        metric['Values'] = metric['Values'][::-1]

    # Return the merged metric data as the final result of the Lambda function
    return {
        "MetricDataResults": allMergedData # Return the merged metric data
    }
  
