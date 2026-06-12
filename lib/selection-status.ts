export const editableSelectionSubmissionStatus = "pending";

export const selectionSubmissionStatuses = ["pending", "confirmed", "paid", "completed", "canceled"] as const;

export type SelectionSubmissionStatus = (typeof selectionSubmissionStatuses)[number];

type SelectionSubmissionStatusMeta = {
  label: string;
  publicLabel: string;
  publicMessage: string;
};

const selectionSubmissionStatusMeta: Record<SelectionSubmissionStatus, SelectionSubmissionStatusMeta> = {
  pending: {
    label: "待确认",
    publicLabel: "Pending confirmation",
    publicMessage: "Your selection is waiting for confirmation. You can still edit it.",
  },
  confirmed: {
    label: "已确认",
    publicLabel: "Confirmed",
    publicMessage: "This selection has been confirmed and can no longer be edited.",
  },
  paid: {
    label: "已付款",
    publicLabel: "Paid",
    publicMessage: "This selection has been paid and can no longer be edited.",
  },
  completed: {
    label: "已完成",
    publicLabel: "Completed",
    publicMessage: "This selection has been completed and can no longer be edited.",
  },
  canceled: {
    label: "已取消",
    publicLabel: "Canceled",
    publicMessage: "This selection has been canceled and can no longer be edited.",
  },
};

export function normalizeSelectionSubmissionStatus(status: string | null | undefined): SelectionSubmissionStatus {
  return selectionSubmissionStatuses.includes(status as SelectionSubmissionStatus)
    ? (status as SelectionSubmissionStatus)
    : editableSelectionSubmissionStatus;
}

export function selectionSubmissionStatusLabel(status: string | null | undefined) {
  return selectionSubmissionStatusMeta[normalizeSelectionSubmissionStatus(status)].label;
}

export function selectionSubmissionPublicStatus(status: string | null | undefined) {
  return selectionSubmissionStatusMeta[normalizeSelectionSubmissionStatus(status)];
}

export function isSelectionSubmissionEditable(status: string | null | undefined) {
  return normalizeSelectionSubmissionStatus(status) === editableSelectionSubmissionStatus;
}
