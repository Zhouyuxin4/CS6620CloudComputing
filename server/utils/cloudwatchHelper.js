// utils/cloudwatchHelper.js
const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch({
  region: process.env.AWS_REGION || "us-east-2",
});

function pushMetric(metricName, value, unit = "Count", dimension = null) {
  const params = {
    Namespace: "YOP/WebSocket",
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
        Dimensions: dimension
          ? [
              {
                Name: "Type",
                Value: dimension,
              },
            ]
          : [],
      },
    ],
  };

  cloudwatch.putMetricData(params, (err) => {
    if (err) console.error("[CloudWatch] Error:", err);
    else console.log(`📈 Metric sent: ${metricName}=${value}`);
  });
}

module.exports = { pushMetric };
