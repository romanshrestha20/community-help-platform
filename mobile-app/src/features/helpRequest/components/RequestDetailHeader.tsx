import React from "react";
import { StyleSheet, Text } from "react-native";

import { Card, Row, Stack } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { HelpRequest } from "../types/helpRequest.types";
import {
  formatRequestBudget,
  formatRequestLocation,
  REQUEST_CATEGORY_LABELS,
} from "../utils/requestDisplay";
import { RequestStatusBadge } from "./RequestStatusBadge";

type Props = {
  request: HelpRequest;
};

export const RequestDetailsHeader = ({ request }: Props) => {
  const { palette } = useThemeContext();

  return (
    <Card>
      <Stack gap="md">
        <Row justify="space-between" align="flex-start">
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            {request.title}
          </Text>
          <RequestStatusBadge status={request.status} />
        </Row>

        <Text style={[styles.category, { color: palette.textSecondary }]}>
          {REQUEST_CATEGORY_LABELS[request.category] ?? request.category}
        </Text>

        <Text style={[styles.description, { color: palette.textSecondary }]}>
          {request.description}
        </Text>

        <Row justify="space-between">
          <Text style={[styles.meta, { color: palette.textSecondary }]}>
            {formatRequestBudget(request)}
          </Text>
          <Text style={[styles.meta, { color: palette.textSecondary }]}>
            {request.bidCount} bid{request.bidCount === 1 ? "" : "s"}
          </Text>
        </Row>

        <Text style={[styles.meta, { color: palette.textSecondary }]}>
          {formatRequestLocation(request)}
        </Text>

        <Text style={[styles.meta, { color: palette.textSecondary }]}>
          Posted by {request.requesterName}
        </Text>
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
  },
  category: {
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  meta: {
    fontSize: 13,
  },
});