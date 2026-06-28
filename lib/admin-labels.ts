const orderStatusMap: Record<string, string> = {
  created: "待支付",
  paid: "已支付",
  failed: "失败",
  cancelled: "已取消",
};

const emailStatusMap: Record<string, string> = {
  pending: "待发送",
  sending: "发送中",
  sent: "已发送",
  failed: "发送失败",
  skipped: "已跳过",
  disabled: "已禁用",
};

export function orderStatusLabel(status: string) {
  return orderStatusMap[status] || status;
}

export function emailStatusLabel(status: string) {
  return emailStatusMap[status] || status;
}
