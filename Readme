This repository contains the updated code for Charlie, as of December 13, 2024.
Steps to Implement in new AWS Account
1.	Run CognitoFull.yml in CloudFormation. Required parameters are as follows:
•	CognitoUserPoolName – name of user pool
•	CognitoUserPoolAppClientName – name of app client in user pool
•	CognitoUserPoolClientCallbackURL – callback URL for redirection after logging into Cognito successfully. Placeholder is https://example.com/callback because if hosting webpage in S3 or somewhere else, do not know that URL yet because it hasn’t been made yet
•	CognitoUserPoolDomainName – prefix of the domain that will be the link to login to Cognito to get auth to then redirect to your metrics webpage
2.	Add a user or users to the Cognito app that you just created
3.	Run API_LAMBDA_IAM.yml
•	IAMRoleName – name of IAM role
•	LambdaFunctionName – name of lambda function that gets the metrics from cloudwatch
•	APIGatewayName – name of the REST API
•	APIGatewayPathname – name of the path that contains the ANY and OPTIONS methods that trigger the Lambda function
•	APIGatewayStagename – name of the stage that the API gets deployed to
4.	Add New Cognito Pool as an Authorizer in the API Gateway that was just created
•	Go to the API Gateway that was just created and select Authorizers in the left-hand column
•	Click Create Authorizer
•	Enter a name
•	Choose Authorizer Type as Cognito
•	Search for and choose the Cognito user pool that you just made 
•	In Token source, enter authorization
•	Make sure authorization is lowercase and nothing else precedes or follows
•	Leave Token validation blank
•	Create Authorizer
5.	Add the Authorizer to an API Gateway Resource
•	In the same API Gateway, choose Resources in the left side column
•	Click on the ANY method that was just created via the YML file under the correct resource path name, and click Edit on the Method Request section
•	For Authorization, choose your authorizer from the drop down
•	For Authorization scopes, add email, all lowercase, nothing preceding or following, and remember to click add, so that is displays in a blue box below
•	Leave everything else as is, and save
6.	Edit Passthrough Behavior on API Gateway
•	On the ANY resource for the correct pathname, choose the Integration Request section and click edit
•	Scroll down to the Request Body Passthrough header in the Method Details section and choose the option for When there are no templates defined (recommended)
•	Click save
7.	Deploy the API Gateway
•	Click on Deploy in the top right, and choose the stage you want to deploy to
•	Once deployed, wait a couple minutes for AWS to update, then test the API on the ANY resource using the Get method type
•	Remember, the required parameters are connectARN and contactFlowARN, the format is just like an API adding query strings: connectARN={insert here}&contactFlowARN={insert here}
8.	Make note of the API Gateway URL
•	In order to write code for the fetch request of the specific method in your API Gateway, you need the URL. This is found in the Stages section, underneath the appropriate stage, resource path, and method. Use this URL in your front end fetch calls
9.	Add API Gateway URL to both fetch request statements for baseURL in the JS file
10.	Add webpage files to a new S3 bucket
•	Create a public access S3 bucket
•	Attach a bucket policy that enables get * objects, should look like the following, just replace with your respective bucket ARN:
{
    "Version": "2012-10-17",
    "Id": "Policy1731609323997",
    "Statement": [
        {
            "Sid": "publicgetobjects",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::{Your Bucket Name}/*"
        }
    ]
}
11.	

