# modules/queue/iam.tf
# IAM policies for queue access
# Based on terraform-skill security-compliance (least privilege)

# Policy document for sending messages to the queue
data "aws_iam_policy_document" "send_message" {
  statement {
    sid    = "AllowSendMessage"
    effect = "Allow"

    actions = [
      "sqs:SendMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
    ]

    resources = [aws_sqs_queue.this.arn]
  }
}

# Policy document for receiving/processing messages from the queue
data "aws_iam_policy_document" "receive_message" {
  statement {
    sid    = "AllowReceiveMessage"
    effect = "Allow"

    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
      "sqs:ChangeMessageVisibility",
    ]

    resources = [aws_sqs_queue.this.arn]
  }
}
