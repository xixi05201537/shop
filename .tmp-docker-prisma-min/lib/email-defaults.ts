export const templateVariables = [
  "{{orderId}}",
  "{{email}}",
  "{{nickname}}",
  "{{productName}}",
  "{{amount}}",
  "{{quantity}}",
  "{{totalAmount}}",
  "{{currency}}",
  "{{paidAt}}",
  "{{trackingNumber}}",
];

export const defaultBuyerEmailSubject = "Thank you for your purchase";

export const defaultBuyerEmailHtml =
  "<h2>Thank you, {{nickname}}</h2><p>Your order <strong>{{orderId}}</strong> for <strong>{{productName}}</strong> is complete.</p><p>Total: {{currency}} {{totalAmount}}</p><p>If you have any questions, please contact us.</p>";

export const defaultAdminEmailSubject = "New order: {{orderId}}";

export const defaultAdminEmailHtml =
  "<h2>New order received</h2><p>{{email}} bought <strong>{{productName}}</strong> x {{quantity}}.</p><p>Total: {{currency}} {{totalAmount}}</p><p>Buyer nickname: {{nickname}}</p>";

export const defaultShipmentEmailSubject = "Your Misaki shop order has shipped: {{orderId}}";

export const defaultShipmentEmailHtml =
  "<h2>Your order has shipped</h2><p>Hi {{nickname}},</p><p>Your order <strong>{{orderId}}</strong> for <strong>{{productName}}</strong> has been shipped.</p><p>Tracking number: <strong>{{trackingNumber}}</strong></p><p>Thank you for supporting Misaki shop.</p>";
